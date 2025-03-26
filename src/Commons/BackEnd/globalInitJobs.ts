import { console_error, console_log } from './globalLogs.js';

interface GlobalInitJobs {
    executed: boolean;
}

let globalState: any;

if (typeof window !== 'undefined') {
    // Client-side environment
    globalState = window;
} else {
    // Server-side environment (Node.js)
    globalState = global;
}

if (!globalState.globalInitJobsExecutionFlag) {
    globalState.globalInitJobsExecutionFlag = {
        executed: false
    } as GlobalInitJobs;
}

export const globalInitJobsExecutionFlag = globalState.globalInitJobsExecutionFlag as GlobalInitJobs;

export async function globalInitJobsExecuteOnlyOnce(): Promise<void> {
    // Log the current flag state
    console_log(0, `Global Init Jobs`, `Execution flag - already executed: ${globalInitJobsExecutionFlag.executed}`);
    // If already executed, skip further execution
    if (globalInitJobsExecutionFlag.executed) {
        console_log(0, `Global Init Jobs`, `Execution skipped as it has already run.`);
        return;
    }
    // Execute your logic here
    try {
        console_log(0, `Global Init Jobs`, `Executing logic for the first time...`);
        //--------------------------------------
        // Cancel all jobs
        const JobBackEndApplied = (await import('../../BackEnd/Job.BackEnd.All.js')).JobBackEndApplied;
        await JobBackEndApplied.cancelAllJobs();
        //--------------------------------------
        // After successful execution, set the flag to true
        globalInitJobsExecutionFlag.executed = true;
        console_log(0, `Global Init Jobs`, `Execution completed successfully. Flag set to true.`);
    } catch (error) {
        console_error(0, `Global Init Jobs`, `Execution failed: ${error}`);
        throw error; // Ensure failures don't set the flag
    }
}
