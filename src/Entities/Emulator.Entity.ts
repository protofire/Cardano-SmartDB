import { Address, Emulator, Lucid, LucidEvolution, PrivateKey } from '@lucid-evolution/lucid';
import 'reflect-metadata';
import { asEntity, Convertible } from '../Commons/index.js';
import { deserealizeEmulator } from '../Commons/conversions.js';
import { BaseEntity } from './Base/Base.Entity.js';

@asEntity()
export class EmulatorEntity extends BaseEntity {
    protected static _className: string = 'Emulator';
    protected static _apiRoute: string = 'emulators';

    // #region fields

    @Convertible({ isUnique: true })
    name!: string;

    @Convertible()
    current!: boolean;

    @Convertible({
        fromPlainObject: deserealizeEmulator,
        // toPlainObject: serializeEmulator
    })
    emulator!: Emulator;

    @Convertible()
    zeroTime!: number;

    @Convertible({ type: String })
    privateKeys!: PrivateKey[];

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields

    // #region class methods

    public static async getTxCountInEmulator(lucid: LucidEvolution, emulatorDB: EmulatorEntity, address: Address) {
        const count = (emulatorDB.emulator as any).slot;
        return count;
    }

    // #endregion class methods
}
