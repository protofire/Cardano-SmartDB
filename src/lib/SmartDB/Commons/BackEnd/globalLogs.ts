//----------------------------------------------------------------------

import { NextApiResponse } from 'next';
import { requestContext } from './globalContext';
import { isNullOrBlank } from '@/src/utils/commons/utils';

export const swShowAlwaysError = process.env.LOGS_SHOW_ALWAYS_ERROR !== undefined ? (process.env.LOGS_SHOW_ALWAYS_ERROR === 'true' ? true : false) : true;
export const swUseFilter = process.env.LOGS_USE_FILTER !== undefined ? (process.env.LOGS_USE_FILTER === 'true' ? true : false) : false;
export const debugNamesInclude: string[] = !isNullOrBlank(process.env.LOGS_FILTER_INCLUDE) ? process.env.LOGS_FILTER_INCLUDE!.split(',').map((name) => name.trim()) : [];
export const debugNamesExclude: string[] = !isNullOrBlank(process.env.LOGS_FILTER_EXCLUDE) ? process.env.LOGS_FILTER_EXCLUDE!.split(',').map((name) => name.trim()) : [];
export const isDebugMode = process.env.DEBUG !== undefined ? process.env.DEBUG === 'true' : false;
export const waitForFLush = !isDebugMode && (process.env.LOGS_WAIT_FOR_FLUSH !== undefined ? process.env.LOGS_WAIT_FOR_FLUSH === 'true' : true);

// console.log(`[globalLogs] - swShowAlwaysError: ${swShowAlwaysError} - swUseFilter: ${swUseFilter} - waitForFLush: ${waitForFLush}`);
// console.log(`[globalLogs] - swUseFilter: ${swUseFilter}`);
// console.log(`[globalLogs] - debugNamesInclude: ${debugNamesInclude}`);
// console.log(`[globalLogs] - debugNamesExclude: ${debugNamesExclude}`);
// console.log(`[globalLogs] - waitForFLush: ${waitForFLush}`);

export function tabs(change: number = 0) {
    if (requestContext.active) {
        let tabs = (requestContext.get('tabs') as number) || 0;
        if (change < 0) {
            tabs += change;
        }
        let str = '';
        if (tabs > 0) {
            str = '|  '.repeat(tabs);
        }
        if (tabs < 0) {
            str = '<<';
        }
        if (change > 0) {
            tabs += change;
        }
        requestContext.set('tabs', tabs);
        return str;
    }
}

export function enhanceResWithLogFlushing(res: NextApiResponse): NextApiResponse {
    // if ((waitForFLush as any) === true) {
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    res.json = (body) => {
        flushLogs(); // Flush logs just before sending the response
        return originalJson(body);
    };

    res.status = (statusCode) => {
        // Return a modified response object with a wrapped .json() method
        const responseWithFlush = originalStatus(statusCode);
        responseWithFlush.json = (body) => {
            flushLogs(); // Flush logs just before sending the response
            return originalJson(body);
        };
        return responseWithFlush;
    };
    return res;
    // } else {
    //     return res;
    // }
}

export function flushLogs() {
    if (requestContext.active) {
        if ((waitForFLush as any) === true) {
            const logs = (requestContext.get('logs') as { message: string; isError: boolean }[]) || [];
            logs.forEach((log) => {
                if (log.isError === true) {
                    console.error(log.message);
                } else {
                    console.log(log.message);
                }
            });
            requestContext.set('logs', []);
        }
        const requestId = requestContext.get('requestId') as string;
        if (!requestId) {
            console.log(
                `[Logs] - isDebugMode: ${isDebugMode} - swShowAlwaysErr: ${swShowAlwaysError} - swUseFilter: ${swUseFilter} - debugNamesInclude.length: ${debugNamesInclude.length} - debugNamesExclude.length: ${debugNamesExclude.length} - waitForFLush: ${waitForFLush}`
            );
        } else {
            console.log(
                `${(requestContext.get('requestId') as string).slice(
                    0,
                    5
                )}  [Logs] - isDebugMode: ${isDebugMode} - swShowAlwaysErr: ${swShowAlwaysError} - swUseFilter: ${swUseFilter} - debugNamesInclude.length: ${
                    debugNamesInclude.length
                } - debugNamesExclude.length: ${debugNamesExclude.length} - waitForFLush: ${waitForFLush}`
            );
        }
        console.log(`------------------------------------------------------------------------------------------------------------------------------------------`);
    } else {
        console.log(
            `[Logs] - isDebugMode: ${isDebugMode} - swShowAlwaysErr: ${swShowAlwaysError} - swUseFilter: ${swUseFilter} - debugNamesInclude.length: ${debugNamesInclude.length} - debugNamesExclude.length: ${debugNamesExclude.length} - waitForFLush: ${waitForFLush}`
        );
        console.log(`------------------------------------------------------------------------------------------------------------------------------------------`);
    }
}

export function console_logBase(tab: number = 0, name: string, text: string, isError: boolean = false) {
    if (requestContext.active) {
        const requestId = requestContext.get('requestId') as string;
        if (!requestId) {
            if (isError) {
                console.error(`${tabs(tab)}[${name}] - INTERNAL ERROR - ${text}`);
            } else {
                console.log(`${tabs(tab)}[${name}] - ${text}`);
            }
        } else {
            if ((waitForFLush as any) === true) {
                let logs = (requestContext.get('logs') as { message: string; isError: boolean }[]) || [];
                const logMessage = `${requestId.slice(0, 5)}-${tabs(tab)}[${name}] - ${text}`;
                logs.push({ message: logMessage, isError });
                requestContext.set('logs', logs);
            } else {
                if (isError) {
                    console.error(`${(requestContext.get('requestId') as string).slice(0, 5)}  ${tabs(tab)}[${name}] - INTERNAL ERROR - ${text}`);
                } else {
                    console.log(`${(requestContext.get('requestId') as string).slice(0, 5)}  ${tabs(tab)}[${name}] - ${text}`);
                }
            }
        }
    } else {
        // If not within an active context, log directly without requestId
        if (isError) {
            console.error(`[${name}] - INTERNAL ERROR - ${text}`);
        } else {
            console.log(`[${name}] - ${text}`);
        }
    }
}

export function console_log(tab: number = 0, name: string, text: string) {
    if (
        (swUseFilter as any) === false ||
        (debugNamesInclude.includes(name) && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && debugNamesExclude.length === 0)
    ) {
        console_logBase(tab, name, text);
    }
}

export function console_logLv1(tab: number = 0, name: string, text: string) {
    if (
        (swUseFilter as any) === false ||
        (debugNamesInclude.includes(name) && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && debugNamesExclude.length === 0)
    ) {
        console_logBase(tab, `${name}*`, text);
    }
}

export function console_logLv2(tab: number = 0, name: string, text: string) {
    if (
        (swUseFilter as any) === false ||
        (debugNamesInclude.includes(name) && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && debugNamesExclude.length === 0)
    ) {
        console_logBase(tab, `${name}**`, text);
    }
}

export function console_error(tab: number = 0, name: string, text: string) {
    if (
        swShowAlwaysError === true ||
        (swUseFilter as any) === false ||
        (debugNamesInclude.includes(name) && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && debugNamesExclude.length === 0)
    ) {
        console_logBase(tab, name, text, true);
    }
}

export function console_errorLv1(tab: number = 0, name: string, text: string) {
    if (
        swShowAlwaysError === true ||
        (swUseFilter as any) === false ||
        (debugNamesInclude.includes(name) && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && debugNamesExclude.length === 0)
    ) {
        console_logBase(tab, `${name}*`, text, true);
    }
}

export function console_errorLv2(tab: number = 0, name: string, text: string) {
    if (
        swShowAlwaysError === true ||
        (swUseFilter as any) === false ||
        (debugNamesInclude.includes(name) && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && !debugNamesExclude.includes(name)) ||
        (debugNamesInclude.length === 0 && debugNamesExclude.length === 0)
    ) {
        console_logBase(tab, `${name}**`, text, true);
    }
}
