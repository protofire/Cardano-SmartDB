import { NextApiResponse } from 'next';
import { BackEndApiHandlersFor, BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { calculateBackoffDelay, console_error, console_log, JOB_MAX_TIME_WAITING_TO_COMPLETE_MS, JOB_TIME_WAITING_TO_TRY_AGAIN_MS, sleep, toJson } from '../Commons/index.BackEnd.js';
import { JobEntity } from '../Entities/Job.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/index.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';
import { DatabaseService } from './DatabaseService/Database.Service.js';
import mongoose from 'mongoose';

@BackEndAppliedFor(JobEntity)
export class JobBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = JobEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    static getOptions(): any {
        if (process.env.USE_DATABASE === 'mongo') {
            return {
                readConcern: mongoose.mongo.ReadConcern.MAJORITY,
                writeConcern: { w: 'majority' as mongoose.mongo.W, j: true },
            };
        } else if (process.env.USE_DATABASE === 'postgresql') {
            return {};
        } else {
            throw `Database not defined`;
        }
    }

    static async startJob(jobId: string, message: string): Promise<JobEntity> {
        // Usamos transacción con snapshot para máxima consistencia
        return await DatabaseService().withContextTransaction(
            `[${this._Entity.className()}] - startJob - ${jobId} - ${message}`,
            async () => {
                // Primero verificamos si existe
                let job = await this.getJob(jobId);
                if (job === undefined) {
                    // Si no existe, creamos nuevo
                    const newJob = new JobEntity({
                        name: jobId,
                        status: 'pending',
                        message,
                        result: false,
                        error: '',
                    });
                    await this.create(newJob);
                    return newJob;
                } else {
                    // Si existe, actualizamos
                    job.status = 'pending';
                    job.message = message;
                    job.result = false;
                    job.error = '';
                    await this.update(job);
                    return job;
                }
            },
            this.getOptions(),
            false // true
        );
    }

    // Nuevo método unificado para obtener/crear job
    static async getOrStartJob(jobId: string, message: string): Promise<{ job: JobEntity; wasCreated: boolean }> {
        return await DatabaseService().withContextTransaction(
            `[${this._Entity.className()}] - getOrStartJob - ${jobId} - ${message}`,
            async () => {
                // Primero verificamos si existe y está activo
                let job = await this.getJob(jobId);
                if (job === undefined || !['pending', 'running'].includes(job.status)) {
                    // Si no existe O no está activo, llamamos a startJob
                    const newJob = await this.startJob(jobId, message);
                    return { job: newJob, wasCreated: true };
                }
                // Existe y está activo
                return { job, wasCreated: false };
            },
            this.getOptions(),
            false // true
        );
    }

    static async executeWithJobLock<T>(
        jobId: string,
        operation: () => Promise<T>,
        options: {
            description?: string;
            maxWaitTimeMs?: number;
            retryDelayMs?: number;
            swLog?: boolean;
        } = {}
    ): Promise<T> {
        const { description = 'Operation', maxWaitTimeMs = JOB_MAX_TIME_WAITING_TO_COMPLETE_MS, retryDelayMs = JOB_TIME_WAITING_TO_TRY_AGAIN_MS, swLog = false } = options;
        let wasCreated = false;
        let lastError: any | undefined = undefined;
        let retries = 0;
        const startTime = Date.now();
        if (swLog) console_log(1, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - Init`);
        const initialDelay = retryDelayMs * (Math.random() * 1); // Random delay between 0 and 1 seconds
        if (swLog) console_log(0, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - Initial delay: ${initialDelay} ms`);
        await sleep(initialDelay);
        try {
            return await DatabaseService().withContextTransaction(
                `[${this._Entity.className()}] - executeWithJobLock - ${jobId} - ${description}`,
                async () => {
                    while (Date.now() - startTime < maxWaitTimeMs) {
                        try {
                            // Try to get or create the job
                            const jobFound = await this.getOrStartJob(jobId, `Starting ${description}...`);
                            const job = jobFound.job;
                            wasCreated = jobFound.wasCreated;
                            // If the job is already active, wait for next try
                            if (!wasCreated && ['pending', 'running'].includes(job.status)) {
                                retries++;
                                const backoffDelay = calculateBackoffDelay(retryDelayMs, retries);
                                if (swLog)
                                    console_log(
                                        0,
                                        `${this._Entity.className()}`,
                                        `executeWithJobLock - ${jobId} - ${description} - There is an existing job ${job.message} - retryDelayMs: ${retryDelayMs} - retries: ${retries} - Waiting ${backoffDelay} ms before retrying...`
                                    );
                                await sleep(backoffDelay);
                                continue;
                            }
                            if (swLog) console_log(0, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - Starting job...`);
                            await this.updateJob(jobId, 'running', undefined, undefined, `Processing ${description}...`);
                            const result = await operation();
                            if (swLog) console_log(0, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - Job completed`);
                            await this.updateJob(jobId, 'completed', true, undefined, `Completed processing ${description}`);
                            // await this.delteJob(jobId);
                            return result;
                        } catch (error: any) {
                            lastError = error;
                            // Mark as failed and throw
                            if (wasCreated) {
                                if (swLog) console_log(0, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - Job failed`);
                                await this.updateJob(jobId, 'failed', false, error.message || toJson(error), `Error processing ${description}`);
                            }
                            throw error;
                        }
                    }
                    // If we've exhausted time or retries
                    throw `Job lock failed after ${(Date.now() - startTime) / 1000} seconds. Last error: ${lastError?.message || lastError || 'Wainting time exhausted'}`;
                },
                this.getOptions(),
                false // true
            );
        } catch (error: any) {
            if (swLog) console_error(0, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - Error: ${error.message || toJson(error)}`);
            throw error;
        } finally {
            if (swLog) console_log(-1, `${this._Entity.className()}`, `executeWithJobLock - ${jobId} - ${description} - END`);
        }
    }

    static async getJob(jobId: string): Promise<JobEntity | undefined> {
        let job: JobEntity | undefined = await this.getOneByParams_({ name: jobId });
        return job;
    }

    static async hasJob(jobId: string): Promise<boolean> {
        return await this.checkIfExists_({ name: jobId });
    }

    static async updateJob(jobId: string, status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled', result?: boolean, error?: string, message?: string) {
        return await DatabaseService().withContextTransaction(
            `[${this._Entity.className()}] - updateJob - ${jobId} - ${message}`,
            async () => {
                let job: JobEntity | undefined = await this.getOneByParams_({ name: jobId });
                if (job === undefined) {
                    throw `Job ${jobId} not found`;
                } else if ((job.status === 'pending' || job.status === 'running') && status === 'running') {
                    // solo se puede cambiar de pending a running, o mensaje de running a running
                    job.status = status;
                    job.result = result ?? job.result;
                    job.error = error ?? job.error;
                    job.message = message ?? job.message;
                    await this.update(job);
                } else if (job.status === 'running' && (status === 'completed' || status === 'failed' || status === 'canceled')) {
                    // solo se puede cambiar de running a completed, failed o canceled
                    job.status = status;
                    job.result = result ?? job.result;
                    job.error = error ?? job.error;
                    job.message = message ?? job.message;
                    await this.update(job);
                } else {
                    return;
                }
            },
            this.getOptions(),
            false // true
        );
    }

    static async cancelAllJobs(): Promise<void> {
        const activeJobs: JobEntity[] = await this.getByParams_({
            status: { $in: ['pending', 'running'] },
        });
        const updatePromises = activeJobs.map(async (job) => {
            job.status = 'canceled';
            job.result = false;
            job.message = 'Job canceled by system';
            job.error = 'Canceled due to system request';
            return this.update(job);
        });
        await Promise.all(updatePromises);
    }

    static async deleteJob(jobId: string): Promise<void> {
        await this.deleteByParams_({
            name: jobId,
        });
    }

    // #endregion class methods
}

@BackEndApiHandlersFor(JobEntity)
export class JobBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = JobEntity;
    protected static _BackEndApplied = JobBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers
    protected static _ApiHandlers: string[] = [];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            // if (query[0] === 'metadata-by-Token') {
            //     req.query = { ...req.query };
            //     // return await this.get_Token_MetadataApiHandler(req, res);
            // } else if (query[0] === 'metadata-by-Tokens') {
            //     req.query = { ...req.query };
            //     // return await this.get_Tokens_MetadataApiHandler(req, res);
            // } else {
            //     console_error(-1, `${this._Entity.className()}`, `executeApiHandlers - Error: Api Handler function not found`);
            //     return res.status(500).json({ error: `Api Handler function not found` });
            // }
        } else {
            console_error(-1, `${this._Entity.className()}`, `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: `Wrong Custom Api route` });
        }
    }
    // #endregion custom api handlers

    // #region api handlers

    // #endregion api handlers
}
