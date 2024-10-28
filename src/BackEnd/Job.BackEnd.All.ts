import { NextApiResponse } from 'next';
import { BackEndApiHandlersFor, BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import { console_error } from '../Commons/index.BackEnd.js';
import { JobEntity } from '../Entities/Job.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/index.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';

@BackEndAppliedFor(JobEntity)
export class JobBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = JobEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    static async startJob(jobId: string, message: string) {
        // const jobs = await JobManagerBackEnd.loadJobs();
        // jobs[jobId] = { jobId, status: 'pending', message };
        // await JobManagerBackEnd.saveJobs(jobs);
        let job: JobEntity | undefined = await this.getOneByParams_({ name: jobId });
        if (job === undefined) {
            const job_: JobEntity = new JobEntity({
                name: jobId,
                status: 'pending',
                message,
                result: false,
                error: '',
            });
            await this.create(job_);
        } else {
            job.status = 'pending';
            job.message = message;
            job.result = false;
            job.error = '';
            await this.update(job);
        }
    }

    static async getJob(jobId: string): Promise<JobEntity | undefined> {
        // const jobs = await JobManagerBackEnd.loadJobs();
        //return jobs[jobId];
        let job: JobEntity | undefined = await this.getOneByParams_({ name: jobId });
        return job;
    }

    static async hasJob(jobId: string): Promise<boolean> {
        // const jobs = await JobManagerBackEnd.loadJobs();
        // if (jobs[jobId] !== undefined) {
        //     return true;
        // }
        // return false;
        return await this.checkIfExists_({ name: jobId });
    }

    static async updateJob(jobId: string, status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled', result?: boolean, error?: string, message?: string) {
        // const jobs = await JobManagerBackEnd.loadJobs();
        // if (jobs[jobId]) {
        //     jobs[jobId] = { ...jobs[jobId], status, result, error, message };
        //     await JobManagerBackEnd.saveJobs(jobs);
        // }
        let job: JobEntity | undefined = await this.getOneByParams_({ name: jobId });
        if (job === undefined) {
            return;
        } else if ((job.status === 'pending' || job.status === 'running') && status === 'running') {
            // solo se puede cambiar de pending a running, o mensaje de running a running
            job.status = status;
            job.result = result ?? job.result;
            job.error = error ?? job.error;
            job.message = message ?? job.message;
            await this.update(job);
        } else if (job.status === 'running' && (status === 'completed' || status === 'failed')) {
            // solo se puede cambiar de running a completed o failed
            job.status = status;
            job.result = result ?? job.result;
            job.error = error ?? job.error;
            job.message = message ?? job.message;
            await this.update(job);
        } else {
            return;
        }
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
            //     // return await this.get_Token_Metadata_ApiHandler(req, res);
            // } else if (query[0] === 'metadata-by-Tokens') {
            //     req.query = { ...req.query };
            //     // return await this.get_Tokens_Metadata_ApiHandler(req, res);
            // } else {
            //     console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
            //     return res.status(500).json({ error: `Api Handler function not found` });
            // }
        } else {
            console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: `Wrong Custom Api route` });
        }
    }
    // #endregion custom api handlers

    // #region api handlers

    // #endregion api handlers
}
