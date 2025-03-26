//--------------------------------------
import { Script } from '@lucid-evolution/lucid';
import path from 'path';
import fs from 'fs/promises';
//---------------------------------------------------------------

export function createScriptFromHEXCBOR(hexCbor: string, type = 'PlutusScriptV2') {
    const script: Script = {
        type: type === 'PlutusScriptV1' ? 'PlutusV1' : type === 'PlutusScriptV2' ? 'PlutusV2' : 'PlutusV3',
        script: '59084c' + hexCbor,
    };
    return script;
}

export async function getScriptFromFile(pathToFile: string): Promise<Script> {
    try {
        //const pathToFile =  path.join(process.env.REACT_SERVER_PATH_FOR_SCRIPTS!, filename);
        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        const jsonFile = JSON.parse(data);
        const script: Script = {
            type: jsonFile.type === 'PlutusScriptV1' ? 'PlutusV1' : jsonFile.type === 'PlutusScriptV2' ? 'PlutusV2' : 'PlutusV3',
            script: jsonFile.cborHex,
        };
        return script;
    } catch (error) {
        console.error('Error reading: ' + pathToFile + ' ' + error);
        throw 'Error reading: ' + pathToFile + ' ' + error;
    }
}

export async function getSymbolFromFile(filename: string) {
    try {
        const pathToFile = path.join(process.env.REACT_SERVER_PATH_FOR_SCRIPTS!, filename);
        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        const jsonFile = JSON.parse(data);
        return jsonFile.bytes;
    } catch (error) {
        console.error('Error reading: ' + filename + ' ' + error);
        throw 'Error reading: ' + filename + ' ' + error;
    }
}

export async function getTextFromFile(filename: string) {
    try {
        const pathToFile = path.join(process.env.REACT_SERVER_PATH_FOR_SCRIPTS!, filename);
        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        return data;
    } catch (error) {
        console.error('Error reading: ' + filename + ' ' + error);
        throw 'Error reading: ' + filename + ' ' + error;
    }
}

export async function mkdir(dir: string) {
    try {
        console.log('Creating folder: ' + dir);
        await fs.mkdir(dir);
        console.log('Created folder: ' + dir);
    } catch (error) {
        console.log('Create folder error (maybe the folder already exists): ' + error);
    }
}

export async function rmdir(dir: string) {
    try {
        console.log('Deleting folder: ' + dir);
        await fs.rmdir(dir, { recursive: true });
        console.log('Deleted folder: ' + dir);
    } catch (error) {
        console.log("Delete folder error (maybe the folder doesn't exists): " + error);
    }
}

//---------------------------------------------------------------
