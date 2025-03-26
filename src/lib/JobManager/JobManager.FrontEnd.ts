import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { JOB_MONITOR_INTERVAL_MS } from '../../Commons/Constants/constants.js';
import { JobEntity } from '../../Entities/Job.Entity.js';
import { JobFrontEndApiCalls } from '../../FrontEnd/ApiCalls/Job.FrontEnd.Api.Calls.js';

export const useJobManager = () => {
    const [jobIds, setJobIds] = useState<string[]>([]);

    useEffect(() => {
        JobManagerFrontEnd.initialize(setJobIds);

        return () => {
            console.log('useEffect cleanup');
            JobManagerFrontEnd.clearAllJobs(); // Clear jobs on unmount
            JobManagerFrontEnd.initialize(null); // Remove the callback
        };
    }, []);

    return { jobIds };
};

export class JobManagerFrontEnd {
    static jobIds: string[] = [];
    static onChangeCallback: Dispatch<SetStateAction<string[]>> | null = null; // Callback to invoke when jobIds change
    static cleanups: Record<string, any> = {};

    // Call this method whenever jobIds change
    static notifyJobIdsChanged() {
        if (typeof JobManagerFrontEnd.onChangeCallback === 'function') {
            JobManagerFrontEnd.onChangeCallback(JobManagerFrontEnd.jobIds);
        }
    }

    // Initialize with a callback to be called on jobIds changes
    public static initialize(onChangeCallback: Dispatch<SetStateAction<string[]>> | null) {
        JobManagerFrontEnd.onChangeCallback = onChangeCallback;
    }

    public static getActiveJobIds() {
        return JobManagerFrontEnd.jobIds;
    }

    // Method to start monitoring a job's status
    public static startMonitoringJob(
        jobId: string,
        setProcessingMessage: (message: string) => void,
        initialMessage: string = ''
    ): { jobPromise: Promise<JobEntity>; cleanup: () => void } {
        // Add the jobId to the tracking list
        JobManagerFrontEnd.jobIds.push(jobId);
        JobManagerFrontEnd.notifyJobIdsChanged();

        let resolveJob: ((value: JobEntity | PromiseLike<JobEntity>) => void) | ((arg0: { name: string; status: string; message: string; result: boolean }) => void),
            rejectJob: (arg0: Error) => void;
        const jobPromise = new Promise<JobEntity>((resolve, reject) => {
            resolveJob = resolve;
            rejectJob = reject;
        });

        let timeoutId = setInterval(async () => {
            try {
                const job: JobEntity | undefined = await JobFrontEndApiCalls.getOneByParamsApi_({ name: jobId });
                if (job === undefined) {
                    // if (response.status === 404) {
                    //     clearInterval(timeoutId);
                    //     resolveJob({ id: jobId, status: 'failed', message: 'Job not found2', result: false });
                    //     console.log(`Job ${jobId} not found, assuming completion.`);
                    //     return;
                    // }
                    throw 'Failed to fetch job';
                }
                if (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') {
                    clearInterval(timeoutId);
                    resolveJob(job);
                    return;
                }
                let finalMessage = initialMessage;
                if (job.message) {
                    finalMessage += finalMessage ? ` - ${job.message}` : job.message;
                }
                //finalMessage += ` - ${job.status}`;
                setProcessingMessage(`${finalMessage}`);
            } catch (error) {
                clearInterval(timeoutId);
                rejectJob(new Error(`Error monitoring job ${jobId}: ${error}`));
            }
        }, JOB_MONITOR_INTERVAL_MS);

        // Store the cleanup function for this jobId
        JobManagerFrontEnd.cleanups[jobId] = () => {
            console.log(`Monitoring for job ${jobId} has been stopped.`);
            clearInterval(timeoutId);
        };

        return { jobPromise, cleanup: JobManagerFrontEnd.cleanups[jobId] };
    }

    // Method to cancel a specific job
    public static async cancelJob(jobId: string) {
        const job: JobEntity | undefined = await JobFrontEndApiCalls.getOneByParamsApi_({ name: jobId });
        if (job === undefined) {
            throw 'Failed to fetch job';
        }
        job.status = 'canceled';
        await JobFrontEndApiCalls.updateApi(job);
        // const response = await fetch(`/api/jobs/cancel/${jobId}`);
        // if (!response.ok) throw new Error('Failed to cancel job');
        // console.log(`Job ${jobId} canceled.`);
        // if (JobManagerFrontEnd.cleanups[jobId]) {
        //     JobManagerFrontEnd.cleanups[jobId](); // Call the cleanup function to clear the interval
        //     delete JobManagerFrontEnd.cleanups[jobId]; // Remove the cleanup reference
        //     // Consider also removing the jobId from jobIds array if you're done with it
        //     //JobManagerFrontEnd.jobIds = JobManagerFrontEnd.jobIds.filter(id => id !== jobId);
        //     // JobManagerFrontEnd.notifyJobIdsChanged();
        //     // Optionally call a backend endpoint to cancel the job there as well
        // }
    }

    // // Method to remove a job from the backend and cleanup resources
    // public static async removeJob(jobId: string): Promise<void> {
    //     try {
    //         if (JobManagerFrontEnd.cleanups[jobId]) {
    //             JobManagerFrontEnd.cleanups[jobId]();
    //             delete JobManagerFrontEnd.cleanups[jobId];
    //         }
    //         // Assume this fetch call correctly hits your backend to remove the job
    //         const response = await fetch(`/api/jobs/remove/${jobId}`); // Adjust as necessary
    //         if (!response.ok) throw new Error('Failed to remove job');
    //         // If successful, remove jobId from tracking and execute its cleanup function
    //         JobManagerFrontEnd.jobIds = JobManagerFrontEnd.jobIds.filter((id) => id !== jobId);
    //         JobManagerFrontEnd.notifyJobIdsChanged();

    //         console.log(`Job ${jobId} removed successfully.`);
    //     } catch (error) {
    //         console.error(`Error removing job ${jobId}:`, error);
    //         throw error;
    //     }
    // }

    // Method to manually trigger cleanup for all jobs
    public static clearAllJobs() {
        JobManagerFrontEnd.jobIds.forEach((jobId) => {
            // this.removeJob(jobId);
            if (JobManagerFrontEnd.cleanups[jobId]) {
                JobManagerFrontEnd.cleanups[jobId]();
                delete JobManagerFrontEnd.cleanups[jobId];
            }
        });
        JobManagerFrontEnd.jobIds = [];
        JobManagerFrontEnd.notifyJobIdsChanged();
        JobManagerFrontEnd.cleanups = {};
    }
}
