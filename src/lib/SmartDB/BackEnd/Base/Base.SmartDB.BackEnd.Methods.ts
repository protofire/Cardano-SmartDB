import { Address, Lucid, UTxO } from 'lucid-cardano';
import { OptionsGet, OptionsGetOne, console_errorLv1, console_logLv1, isEmulator, isFrontEndEnvironment, isNullOrBlank, showData, tabs, toJson } from '../../Commons/index.BackEnd';
import { isNFT_With_AC_Lucid_InValue } from '../../Commons/helpers';
import { AddressToFollowEntity } from '../../Entities/AddressToFollow.Entity';
import { BaseSmartDBEntity } from '../../Entities/Base/Base.SmartDB.Entity';
import { EmulatorEntity } from '../../Entities/Emulator.Entity';
import { SmartUTxOEntity } from '../../Entities/SmartUTxO.Entity';
import { BaseBackEndMethods } from './Base.BackEnd.Methods';
import { TimeApi } from '../../lib';

// BaseSmartDBBackEndMethods es generico
// Todos los metodos reciven o instancia o entidad
// De todas formas tiene los metodos _ que son especificos

export class BaseSmartDBBackEndMethods extends BaseBackEndMethods {
    //protected static _Entity = BaseSmartDBEntity;

    // #region class methods

    public static async getBySmartUTxO<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        smartUTxO_id: string,
        optionsGet?: OptionsGetOne,
        restricFilter?: Record<string, any>
    ): Promise<T | undefined> {
        try {
            if (isNullOrBlank(smartUTxO_id)) {
                throw `smartUTxO id not defined`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                //return await this.getOneByParamsApi<T>({ smartUTxO_id }, optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv1(0, Entity.className(), `getBySmartUTxO  - Init`);
            //----------------------------
            const instance = await this.getOneByParams<T>(Entity, { smartUTxO_id }, optionsGet, restricFilter);
            return instance;
        } catch (error) {
            console_errorLv1(0, Entity.className(), `getBySmartUTxO - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async getDeployed<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, optionsGet?: OptionsGet, restricFilter?: Record<string, any>): Promise<T[]> {
        try {
            if (isFrontEndEnvironment()) {
                //return await this.getDeployedApi<T>(optionsGet);
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_logLv1(0, Entity.className(), `getDeployed  - Init`);
            //----------------------------
            return await this.getByParams<T>(Entity, { _isDeployed: true }, optionsGet, restricFilter);
        } catch (error) {
            console_errorLv1(0, Entity.className(), `getDeployed - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async syncWithAddress<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        lucid: Lucid,
        emulatorDB: EmulatorEntity | undefined,
        addressToFollow: AddressToFollowEntity,
        force: boolean | undefined,
        tryCountAgain: boolean = true
    ) {
        if (isFrontEndEnvironment()) {
            throw 'This method is only for backend';
        }
        //----------------------------
        const address = addressToFollow.address;
        //--------------------------------------
        console_logLv1(1, Entity.className(), `syncWithAddress - address ${address} - Init`);
        //--------------------------------------
        const tx_count_DB = addressToFollow.txCount;
        //--------------------------------------
        let tx_count_blockchain = undefined;
        if (isEmulator) {
            tx_count_blockchain = await EmulatorEntity.getTxCountInEmulator(lucid, emulatorDB!, address);
        } else {
            try {
                // la primera vez espera 5 segundos, la segunda 5, la tercera 10
                const times = [5000, 5000, 10000];
                for (let i = 0; i < 3; i++) {
                    tx_count_blockchain = await TimeApi.getTxCountBlockfrostApi(address);
                    if (tx_count_blockchain === tx_count_DB && force !== true && tryCountAgain === true) {
                        // a veces el api de query tx dice que la transaccion existe, pero el api de tx count no lo refleja
                        // agrego esto por las dudas, para dar tiempo a blockfrost actualize sus registros
                        console_logLv1(0, Entity.className(), `syncWithAddress - waiting extra time (${i}/3) because counts (${tx_count_blockchain}) are still the same...`
                        );
                        await new Promise((resolve) => setTimeout(resolve, times[i])); // Wait for 5 seconds
                    } else {
                        break; // Exit the loop if condition is not met
                    }
                }
            } catch (error) {
                console_errorLv1(0, Entity.className(), `syncWithAddress - Error: ${error}`);
                return;
            }
        }
        //--------------------------------------
        console_logLv1(0, Entity.className(), `syncWithAddress - tx_count_DB: ${tx_count_DB}`);
        console_logLv1(0, Entity.className(), `syncWithAddress - tx_count_blockchain ${tx_count_blockchain}`);
        //--------------------------------------
        if (tx_count_blockchain !== tx_count_DB || force) {
            //--------------------------------------
            console_logLv1(0, Entity.className(), `syncWithAddress - triggering a sync because tx counts are different or was forced...`);
            //--------------------------------------
            const realUTxOs: UTxO[] = await lucid.utxosAt(address);
            const smartUTxOs = await this.getByParams<SmartUTxOEntity>(SmartUTxOEntity, { address }, { loadRelations: {} });
            //--------------------------------------
            console_logLv1(0, Entity.className(), `syncWithAddress - UTxOs Blockchain: ` + realUTxOs.length);
            console_logLv1(0, Entity.className(), `syncWithAddress - UTxOs DB: ` + smartUTxOs.length);
            //--------------------------------------
            // comparo la red con la base de datos
            //--------------------------------------
            let instancesNotOnlyDatumToUpdate: T[] = [];
            instancesNotOnlyDatumToUpdate = await this.deleteOrUpdate_Instances_And_DeleteSmartUTxOs_ThatDoesNotExists<T>(
                Entity,
                smartUTxOs,
                realUTxOs,
                instancesNotOnlyDatumToUpdate
            );
            instancesNotOnlyDatumToUpdate = await this.create_NewSmartUTxOs_And_CreateOrUpdate_Instances<T>(
                Entity,
                realUTxOs,
                smartUTxOs,
                addressToFollow,
                instancesNotOnlyDatumToUpdate
            );
            //--------------------------------------
            if (force === true) {
                //--------------------------------------
                // solo hare esto cuando se haga sync force. Si no es mucha sobre carga
                //--------------------------------------
                instancesNotOnlyDatumToUpdate = await this.deleteOrUpdate_With_MissingSmartUTxO<T>(Entity, instancesNotOnlyDatumToUpdate);
                instancesNotOnlyDatumToUpdate = await this.checkIfAllInstancesExits<T>(Entity, addressToFollow, instancesNotOnlyDatumToUpdate);
                //--------------------------------------
            }
            //--------------------------------------
            for (const instance of instancesNotOnlyDatumToUpdate) {
                await this.updateSyncSmartUTxO(instance);
            }
            //--------------------------------------
            addressToFollow.txCount = tx_count_blockchain;
            await this.update(addressToFollow);
            //--------------------------------------
            console_logLv1(-1, Entity.className(), `syncWithAddress - address ${address} - OK`);
            //--------------------------------------
        }
        return;
    }

    // #endregion class methods

    // #region sync helpers

    private static async updateSyncSmartUTxO<T extends BaseSmartDBEntity>(instance: T, address?: Address): Promise<void> {
        try {
            if (isNullOrBlank(instance._DB_id)) {
                throw `id not defined`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                throw 'This method is only for backend';
            }
            //----------------------------
            console_logLv1(1, instance.className(), `updateSyncSmartUTxO  - Init`);
            //----------------------------
            if (process.env.USE_DATABASE === 'mongo') {
                if (instance.smartUTxO === undefined) {
                    instance._isDeployed = false;
                    instance.deleteMyDatum();
                    await this.update(instance, { loadRelations: {} });
                } else {
                    instance._isDeployed = true;
                    if (address !== undefined) {
                        instance._NET_address = address;
                    }
                    await this.update(instance, { loadRelations: {} });
                }
                //----------------------------
                console_logLv1(-1, instance.className(), `updateSyncSmartUTxO - Instance: ${instance.show()} - OK`);
                //----------------------------
            } else {
                throw `Database not defined`;
            }
        } catch (error) {
            console_errorLv1(-1, instance.className(), `updateSyncSmartUTxO - Error: ${error}`);
            throw `${error}`;
        }
    }

    private static async deleteOrUpdate_Instances_And_DeleteSmartUTxOs_ThatDoesNotExists<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        smartUTxOs: SmartUTxOEntity[],
        realUTxOs: UTxO[],
        instancesNotOnlyDatumToUpdate: T[]
    ): Promise<T[]> {
        //--------------------------------------
        console_logLv1(1, Entity.className(), `deleteOrUpdate_Instances_And_DeleteSmartUTxOs_ThatDoesNotExists - Init`);
        //--------------------------------------
        let swDeleteSome = false;
        //--------------------------------------
        for (const smartUTxO of smartUTxOs) {
            const found = realUTxOs.find((realUTxO) => realUTxO.txHash === smartUTxO.txHash && realUTxO.outputIndex === smartUTxO.outputIndex);
            if (!found) {
                swDeleteSome = true;
                //--------------------------------------
                const instanceNotOnlyDatumToUpdate = await this.deleteOrUpdate_Instance_And_DeleteSmartUTxO<T>(Entity, smartUTxO);
                //--------------------------------------
                if (instanceNotOnlyDatumToUpdate !== undefined) {
                    const index = instancesNotOnlyDatumToUpdate.findIndex((instance_) => instance_._DB_id === instanceNotOnlyDatumToUpdate._DB_id);
                    if (index !== -1) {
                        instancesNotOnlyDatumToUpdate[index] = instanceNotOnlyDatumToUpdate;
                    } else {
                        instancesNotOnlyDatumToUpdate.push(instanceNotOnlyDatumToUpdate);
                    }
                }
            }
        }
        //--------------------------------------
        if (swDeleteSome) {
            console_logLv1(-1, Entity.className(), `deleteOrUpdate_Instances_And_DeleteSmartUTxOs_ThatDoesNotExists - Done! - OK`);
        } else {
            console_logLv1(-1, Entity.className(), `deleteOrUpdate_Instances_And_DeleteSmartUTxOs_ThatDoesNotExists - Nothing to delete - OK`);
        }
        //--------------------------------------
        return instancesNotOnlyDatumToUpdate;
    }

    private static async deleteOrUpdate_Instance_And_DeleteSmartUTxO<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        smartUTxO: SmartUTxOEntity
    ): Promise<T | undefined> {
        //--------------------------------------
        // elimino las SmartUTXO que no estan en la red y actualizo las instancias vinculadas a esa SmartUTxO
        //--------------------------------------
        console_logLv1(1, Entity.className(), `deleteOrUpdate_Instance_And_DeleteSmartUTxO - preparing for delete UTxO DB: ${smartUTxO.show()} - Init`);
        //--------------------------------------
        // busco alguna instancia que tenga asignada la smart que quiero borrar
        let instance = await this.getBySmartUTxO<T>(Entity, smartUTxO._DB_id, { loadRelations: {} });
        //--------------------------------------
        if (instance === undefined) {
            if (Entity.is_NET_id_Unique()) {
                // como el id es unico, ademas de buscar la smart id, puedo buscar por cs y tn para ver si elimino o actualizo
                instance = await this.getOneByParams<T>(Entity, { _NET_id_CS: smartUTxO._NET_id_CS, _NET_id_TN: smartUTxO._NET_id_TN });
            }
        }
        //--------------------------------------
        let swIsInstanceNotOnlyDatum = false;
        //--------------------------------------
        if (instance !== undefined) {
            if (Entity.isOnlyDatum()) {
                console_logLv1(0, Entity.className(), `deleteOrUpdate_Instance_And_DeleteSmartUTxO - deleting instance: ${instance.show()} because is isOnlyDatum`);
                await this.delete(instance);
            } else {
                console_logLv1(0, Entity.className(), `deleteOrUpdate_Instance_And_DeleteSmartUTxO - updating instance: ${instance.show()} without UTxO DB linked`);
                instance.smartUTxO_id = undefined;
                instance.smartUTxO = undefined;
                swIsInstanceNotOnlyDatum = true;
            }
        } else {
            console_errorLv1(0, Entity.className(), `deleteOrUpdate_Instance_And_DeleteSmartUTxO - there were no instances linked to this UTxO DB`);
        }
        //--------------------------------------
        await this.delete(smartUTxO);
        //--------------------------------------
        console_logLv1(-1, Entity.className(), `deleteOrUpdate_Instance_And_DeleteSmartUTxO - UTxO DB deleted - OK`);
        //--------------------------------------
        if (swIsInstanceNotOnlyDatum) {
            return instance;
        } else {
            return undefined;
        }
    }

    private static async create_NewSmartUTxOs_And_CreateOrUpdate_Instances<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        realUTxOs: UTxO[],
        smartUTxOs: SmartUTxOEntity[],
        addressToFollow: AddressToFollowEntity,
        instancesNotOnlyDatumToUpdate: T[]
    ): Promise<T[]> {
        //--------------------------------------
        console_logLv1(1, Entity.className(), `create_NewSmartUTxOs_And_CreateOrUpdate_Instances - adding new UTxOs in DB - Init`);
        //--------------------------------------
        let swAddedSome = false;
        //--------------------------------------
        for (const realUTxO of realUTxOs) {
            const found = smartUTxOs.find((smartUTxO) => realUTxO.txHash === smartUTxO.txHash && realUTxO.outputIndex === smartUTxO.outputIndex);
            if (!found) {
                swAddedSome = true;
                //--------------------------------------
                const instanceNotOnlyDatumToUpdate = await this.create_NewSmartUTxO_And_CreateOrUpdate_Instance<T>(Entity, realUTxO, addressToFollow);
                //--------------------------------------
                if (instanceNotOnlyDatumToUpdate !== undefined) {
                    const index = instancesNotOnlyDatumToUpdate.findIndex((instance_) => instance_._DB_id === instanceNotOnlyDatumToUpdate._DB_id);
                    if (index !== -1) {
                        instancesNotOnlyDatumToUpdate[index] = instanceNotOnlyDatumToUpdate;
                    } else {
                        instancesNotOnlyDatumToUpdate.push(instanceNotOnlyDatumToUpdate);
                    }
                }
            }
        }
        //--------------------------------------
        if (swAddedSome) {
            console_logLv1(-1, Entity.className(), `create_NewSmartUTxOs_And_CreateOrUpdate_Instances - Done! - OK`);
        } else {
            console_logLv1(-1, Entity.className(), `create_NewSmartUTxOs_And_CreateOrUpdate_Instances - Nothing to add - OK`);
        }
        //--------------------------------------
        return instancesNotOnlyDatumToUpdate;
    }

    private static async create_NewSmartUTxO_And_CreateOrUpdate_Instance<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        realUTxO: UTxO,
        addressToFollow: AddressToFollowEntity
    ): Promise<T | undefined> {
        //--------------------------------------
        // agrego las que estan en la red y no en la base de datos
        //--------------------------------------
        const showUtTxO = {
            txHash: realUTxO.txHash,
            outputIndex: realUTxO.outputIndex,
        };
        console_logLv1(0, Entity.className(), `create_NewSmartUTxO_And_CreateOrUpdate_Instance - inserting new UTxO in DB: ${showData(showUtTxO)}`);
        //--------------------------------------
        const plainObject = JSON.parse(toJson(realUTxO));
        const newSmartUTxO = SmartUTxOEntity.fromPlainObject<SmartUTxOEntity>(plainObject);
        //--------------------------------------
        const instance = await this.createOrUpdate_Instance_From_SmartUTxO<T>(Entity, newSmartUTxO, addressToFollow);
        //--------------------------------------
        return instance;
    }

    private static async findInstanceToBeLinked<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, newSmartUTxO: SmartUTxOEntity): Promise<T | undefined> {
        //--------------------------------------
        const instances = await this.getAll<T>(Entity, { loadRelations: {} });
        //--------------------------------------
        for (const instance of instances) {
            // obtengo el id de esta instancia
            const NET_ID_Lucid = instance.getNet_id_AC_Lucid();
            // y lo busco en los assets de la utxo. Es la forma de relacionarlos
            if (isNFT_With_AC_Lucid_InValue(newSmartUTxO.assets, NET_ID_Lucid)) {
                return instance;
            }
        }
    }

    private static async createOrUpdate_Instance_From_SmartUTxO<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        newSmartUTxO: SmartUTxOEntity,
        addressToFollow: AddressToFollowEntity,
        instanceToLink?: T
    ): Promise<T | undefined> {
        //--------------------------------------
        if (!newSmartUTxO.datum) {
            //TODO get datum from datum hash
            throw 'datum not found';
        }
        //--------------------------------------
        let datum;
        try {
            datum = Entity.mkDatumFromDatumCborHex<T>(newSmartUTxO.datum);
        } catch (error) {
            console_errorLv1(0, Entity.className(), `createOrUpdate_Instance_From_SmartUTxO - this UTxO DB has a datum of another format - this sync process will not add it - try other syncs methods`
            );
            return;
        }
        //--------------------------------------
        let swIsInstanceNotOnlyDatum = false;
        let instanceNotOnlyDatum: T | undefined = undefined;
        //--------------------------------------
        if (Entity.isOnlyDatum()) {
            //--------------------------------------
            const instance = new Entity(datum);
            //--------------------------------------
            instance._NET_address = addressToFollow.address;
            instance._NET_id_CS = addressToFollow.currencySymbol;
            if (!isNullOrBlank(addressToFollow.tokenName)) {
                instance._NET_id_TN = addressToFollow.tokenName;
            }
            instance._creator = 'internal';
            //--------------------------------------
            instance.smartUTxO = newSmartUTxO;
            //--------------------------------------
            newSmartUTxO._NET_id_CS = instance.getNET_id_CS();
            newSmartUTxO._NET_id_TN = instance.getNET_id_TN();
            newSmartUTxO._is_NET_id_Unique = Entity.is_NET_id_Unique();
            newSmartUTxO.datumType = Entity.className();
            newSmartUTxO.datumObj = datum;
            //--------------------------------------
            // antes de agregarla quiero revisar que no exista.
            // eso solo puedo saberlo si tiene id NFT unico
            // en el caso de que el id no sea unico habra una comprobacion al final que se realiza cuando se hace force sync
            if (Entity.is_NET_id_Unique()) {
                const instanceOld = await this.getOneByParams<T>(Entity, { _NET_id_CS: instance.getNET_id_CS(), _NET_id_TN: instance.getNET_id_TN() });
                if (instanceOld !== undefined) {
                    console_logLv1(0, Entity.className(), `createOrUpdate_Instance_From_SmartUTxO - instance: ${instanceOld.show()} already exists`);
                    console_logLv1(0, Entity.className(), `createOrUpdate_Instance_From_SmartUTxO - deleting it before creating it again`);
                    await this.delete(instanceOld);
                }
            }
            //--------------------------------------
            console_logLv1(0, Entity.className(), `createOrUpdate_Instance_From_SmartUTxO - inserting instance: ${instance.show()} with UTxO DB linked`);
            //--------------------------------------
            await this.create(instance);
            //--------------------------------------
        } else {
            // las instancias que no son isOnlyDatum se supone que son si o si con ID unico, si no no habria forma de relacionar cada entrada de la base con las utxos.
            if (!Entity.is_NET_id_Unique()) {
                throw `is_NET_id_Unique must be true`;
            }
            //--------------------------------------
            console_logLv1(0, Entity.className(), `createOrUpdate_Instance_From_SmartUTxO - updating instance with UTxO DB linked...`);
            //--------------------------------------
            if (instanceToLink === undefined) {
                instanceToLink = await this.findInstanceToBeLinked(Entity, newSmartUTxO);
            }
            if (instanceToLink !== undefined) {
                //--------------------------------------
                instanceToLink.fillMeFromObject<T>(datum);
                //--------------------------------------
                instanceToLink.smartUTxO_id = undefined;
                instanceToLink.smartUTxO = newSmartUTxO;
                //--------------------------------------
                newSmartUTxO._NET_id_CS = instanceToLink.getNET_id_CS();
                newSmartUTxO._NET_id_TN = instanceToLink.getNET_id_TN();
                newSmartUTxO._is_NET_id_Unique = Entity.is_NET_id_Unique();
                newSmartUTxO.datumType = Entity.className();
                newSmartUTxO.datumObj = datum;
                //--------------------------------------
                console_logLv1(0, Entity.className(), `createOrUpdate_Instance_From_SmartUTxO - updating instance: ${instanceToLink.show()} with smartUTxO linked`);
                //--------------------------------------
                swIsInstanceNotOnlyDatum = true;
                instanceNotOnlyDatum = instanceToLink;
                //--------------------------------------
            }
        }
        //--------------------------------------
        if (swIsInstanceNotOnlyDatum) {
            return instanceNotOnlyDatum;
        } else {
            return undefined;
        }
    }

    private static async deleteOrUpdate_With_MissingSmartUTxO<T extends BaseSmartDBEntity>(Entity: typeof BaseSmartDBEntity, instancesNotOnlyDatumToUpdate: T[]): Promise<T[]> {
        //--------------------------------------
        // elimino instancas que tengan una SmartUTxO que no existe por alguna razon
        //--------------------------------------
        console_logLv1(1, Entity.className(), `deleteOrUpdate_With_MissingSmartUTxO - Init`);
        //--------------------------------------
        let swUpdatedOrDeletedSome: boolean = false;
        //--------------------------------------
        const instancesToUpdateOrDelete = await this.getAll<T>(Entity, { loadRelations: {} });
        //--------------------------------------
        for (const instance of instancesToUpdateOrDelete) {
            //--------------------------------------
            if (instance.smartUTxO_id !== undefined) {
                const smartUTxO = await this.getById<SmartUTxOEntity>(SmartUTxOEntity, instance.smartUTxO_id, { loadRelations: {} });
                //--------------------------------------
                if (smartUTxO === undefined) {
                    swUpdatedOrDeletedSome = true;
                    if (Entity.isOnlyDatum()) {
                        console_logLv1(0, Entity.className(), `deleteOrUpdate_With_MissingSmartUTxO - deleting instance: ${instance.show()} because is isOnlyDatum`);
                        await this.delete(instance);
                    } else {
                        console_logLv1(0, Entity.className(), `deleteOrUpdate_With_MissingSmartUTxO - updating instance: ${instance.show()} without smartUTxO linked`);
                        //--------------------------------------
                        instance.smartUTxO_id = undefined;
                        instance.smartUTxO = undefined;
                        //--------------------------------------
                        const index = instancesNotOnlyDatumToUpdate.findIndex((instance_) => instance_._DB_id === instance._DB_id);
                        if (index !== -1) {
                            instancesNotOnlyDatumToUpdate[index] = instance;
                        } else {
                            instancesNotOnlyDatumToUpdate.push(instance);
                        }
                    }
                }
            } else {
                //--------------------------------------
                if (Entity.isOnlyDatum()) {
                    swUpdatedOrDeletedSome = true;
                    console_logLv1(0, Entity.className(), `deleteOrUpdate_With_MissingSmartUTxO - deleting instance: ${instance.show()} because is isOnlyDatum`);
                    await this.delete(instance);
                }
                //--------------------------------------
            }
        }
        //--------------------------------------
        if (swUpdatedOrDeletedSome) {
            console_logLv1(-1, Entity.className(), `deleteOrUpdate_With_MissingSmartUTxO - Done! - OK`);
        } else {
            console_logLv1(-1, Entity.className(), `deleteOrUpdate_With_MissingSmartUTxO - Nothing to update/delete - OK`);
        }
        //--------------------------------------
        return instancesNotOnlyDatumToUpdate;
    }

    private static async checkIfAllInstancesExits<T extends BaseSmartDBEntity>(
        Entity: typeof BaseSmartDBEntity,
        addressToFollow: AddressToFollowEntity,
        instancesNotOnlyDatumToUpdate: T[]
    ): Promise<T[]> {
        //--------------------------------------
        // reviso todas las smartDB y chekeo que exista el registro.
        // Es posible que haya eliminado la tabla o el registro y que haya dejado la smartUtxo. En ese caso hay que recrear el registro
        // no deberia ser algo normal. No se deben eliminar registros o tablas que en realidad estan en la blockchain de forma manual.
        //--------------------------------------
        console_logLv1(1, Entity.className(), `checkIfAllInstancesExits - Init`);
        //--------------------------------------
        let swSomeMissedInstances = false;
        //--------------------------------------
        const smartUTxOs = await this.getByParams<SmartUTxOEntity>(SmartUTxOEntity, { address: addressToFollow.address, datumType: Entity.className() });
        const instances = await this.getAll<T>(Entity, { loadRelations: {} });
        console_logLv1(0, Entity.className(), `checkIfAllInstancesExits - UTxOs DB in this adddress with this datumType: ` + smartUTxOs.length);
        console_logLv1(0, Entity.className(), `checkIfAllInstancesExits - Instances in DB: ` + instances.length);
        //--------------------------------------
        if (Entity.isOnlyDatum()) {
            if (smartUTxOs.length > instances.length) {
                // voy a revisar si hay mas utxos que isntancias
                // el caso contrario no me interesa por que ya debio haber sido eliminado antes alguna instancia que tenia una utxo invalida
                // el problema son las instancias sin utxo por ejemplo. un error que solo se daria si se manipulo la base de datos
                //--------------------------------------
                console_logLv1(0, Entity.className(), `checkIfAllInstancesExits - UTxOs DB and Instances dont match, must check each one`);
                //--------------------------------------
                swSomeMissedInstances = true;
                //--------------------------------------
                for (const instance of instances) {
                    await this.delete<T>(instance);
                }
                for (const smartUTxO of smartUTxOs) {
                    await this.createOrUpdate_Instance_From_SmartUTxO(Entity, smartUTxO, addressToFollow);
                }
            }
        } else {
            //--------------------------------------
            // si no es only datum, entonces lo que puede haber pasado es que la instancia quedo sin deployar y la utxo existe
            //--------------------------------------
            if (smartUTxOs.length > instances.length) {
                console_errorLv1(0, Entity.className(), `checkIfAllInstancesExits - UTxOs DB and Instances dont match, but i cant create not IsOnlyDatum instances again...`);
            }
            for (const instance of instances) {
                if (instance.smartUTxO_id === undefined) {
                    const NET_ID_Lucid = instance.getNet_id_AC_Lucid();
                    for (const smartUTxO of smartUTxOs) {
                        if (isNFT_With_AC_Lucid_InValue(smartUTxO.assets, NET_ID_Lucid)) {
                            //--------------------------------------
                            swSomeMissedInstances = true;
                            //--------------------------------------
                            const instanceNotOnlyDatumToUpdate = await this.createOrUpdate_Instance_From_SmartUTxO(Entity, smartUTxO, addressToFollow, instance);
                            //--------------------------------------
                            if (instanceNotOnlyDatumToUpdate !== undefined) {
                                const index = instancesNotOnlyDatumToUpdate.findIndex((instance_) => instance_._DB_id === instanceNotOnlyDatumToUpdate._DB_id);
                                if (index !== -1) {
                                    instancesNotOnlyDatumToUpdate[index] = instanceNotOnlyDatumToUpdate;
                                } else {
                                    instancesNotOnlyDatumToUpdate.push(instanceNotOnlyDatumToUpdate);
                                }
                            }
                        }
                    }
                }
            }
        }
        //--------------------------------------
        if (swSomeMissedInstances) {
            console_logLv1(-1, Entity.className(), `checkIfAllInstancesExits - Done! - OK`);
        } else {
            console_logLv1(-1, Entity.className(), `checkIfAllInstancesExits - Nothing to create/update - OK`);
        }
        //--------------------------------------
        return instancesNotOnlyDatumToUpdate;
    }

    // #endregion sync helpers
}
