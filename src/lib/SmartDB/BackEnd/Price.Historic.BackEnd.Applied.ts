import { daysBetweenDates, endOfDay, hexToStr, isFrontEndEnvironment, showData, startOfDay } from '@/src/utils/commons/utils';
import { VALID_APROXIMATED_PRICE_TIME_MS } from '@/src/utils/specific/constants';
import { TimeBackEnd } from '../lib/Time/backEnd';
import {
    Token_Historic_Price,
    Token_With_Price_And_Date_And_Signature,
    isTokenADA,
    isToken_CS_And_TN_Valid,
    type CS,
    type TN,
    POSIXTime,
    formatHash,
    OptionsGet,
} from '../Commons';
import { BackEndAppliedFor } from '../Commons/Decorator.BackEndAppliedFor';
import { console_error, console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { PriceHistoricEntity } from '../Entities/Price.Historic.Entity';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods';
import { PriceBackEndApplied } from './Price.BackEnd.Applied';

@BackEndAppliedFor(PriceHistoricEntity)
export class PriceHistoricBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = PriceHistoricEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    private static interpolatePrice(beforePrice: bigint, afterPrice: bigint, beforeTime: POSIXTime, afterTime: POSIXTime, targetTime: POSIXTime): bigint {
        //----------------------------
        // Ensure dates are in proper order
        if (targetTime < beforeTime || targetTime > afterTime) {
            throw 'Target time is out of bounds';
        }
        //----------------------------
        // Calculate time spans
        const totalSpan = afterTime - beforeTime;
        const targetSpan = targetTime - beforeTime;
        //----------------------------
        // Calculate interpolation factor
        const factor = Number(targetSpan) / Number(totalSpan);
        //----------------------------
        // Calculate interpolated price
        const priceDiff = Number(afterPrice - beforePrice);
        const interpolatedDiff = priceDiff * factor;
        //----------------------------
        return BigInt(Math.round(Number(beforePrice) + interpolatedDiff));
        //----------------------------
    }

    private static async fillGap(
        gapStart: number,
        gapEnd: number,
        beforeToken: Token_Historic_Price | undefined,
        afterToken: Token_Historic_Price | undefined
    ): Promise<Token_Historic_Price[]> {
        //----------------------------
        const historic_prices: Token_Historic_Price[] = [];
        //----------------------------
        if (beforeToken && afterToken) {
            //----------------------------
            console_log(0, this._Entity.className(), `fillGap - interpolatePrice from: ${beforeToken.priceADAx1e6}, to: ${afterToken.priceADAx1e6}`);
            //----------------------------
            for (let time = new Date(gapStart).getTime(); time <= gapEnd; time = new Date(time).setDate(new Date(time).getDate() + 1)) {
                //----------------------------
                const newPriceADAx1e6 = this.interpolatePrice(beforeToken.priceADAx1e6, afterToken.priceADAx1e6, beforeToken.date, afterToken.date, BigInt(time));
                //----------------------------
                console_log(0, this._Entity.className(), `fillGap - newPriceADAx1e6: ${newPriceADAx1e6}`);
                //----------------------------
                // await saveNewPrice(CS, TN_Hex, time, newPriceADAx1e6);
                //----------------------------
                const newToken: Token_Historic_Price = { priceADAx1e6: newPriceADAx1e6, date: BigInt(time) };
                //----------------------------
                historic_prices.push(newToken);
            }
        } else if (afterToken) {
            //----------------------------
            // Handle the case where only 'after' data is available
            //----------------------------
            let lastPriceADAx1e6 = afterToken.priceADAx1e6;
            //----------------------------
            console_log(0, this._Entity.className(), `fillGap - creating backwards from: ${afterToken.priceADAx1e6}`);
            //----------------------------
            for (let time = new Date(gapEnd).getTime(); time >= gapStart; time = new Date(time).setDate(new Date(time).getDate() - 1)) {
                //----------------------------
                let newPriceADAx1e6 = lastPriceADAx1e6;
                //----------------------------
                const randomChoice = Math.floor(Math.random() * 10);
                // Define percentage changes: +/- 10%, +/- 5%, etc.
                const percentageChanges = [-10, 10, -5, 5, -4]; // Percentages
                const selectedPercentage = randomChoice > percentageChanges.length ? 0 : percentageChanges[randomChoice % percentageChanges.length];
                const percentageFactor = selectedPercentage / 100;
                // Apply the percentage change
                newPriceADAx1e6 += BigInt(Math.round(Number(newPriceADAx1e6) * percentageFactor));
                // Ensure price doesn't fall below a certain threshold
                newPriceADAx1e6 = newPriceADAx1e6 < 0n ? 1000000n : newPriceADAx1e6;
                //----------------------------
                console_log(0, this._Entity.className(), `fillGap - newPriceADAx1e6: ${newPriceADAx1e6}`);
                //----------------------------
                lastPriceADAx1e6 = newPriceADAx1e6;
                //----------------------------
                //await saveNewPrice(CS, TN_Hex, time, newPriceADAx1e6);
                //----------------------------
                const newToken: Token_Historic_Price = { priceADAx1e6: newPriceADAx1e6, date: BigInt(time) };
                //----------------------------
                historic_prices.push(newToken);
            }
        } else {
            // Handle the case where there's no 'before' or 'after' data
            throw 'Unexpected scenario: No adjacent price data for interpolation';
        }
        //----------------------------
        return historic_prices;
    }

    public static async get_Token_Historic_PriceADAx1e6x1e3_SpecificDay(
        CS: CS,
        TN_Hex: TN,
        time: POSIXTime,
        lastToken: Token_Historic_Price | undefined,
        forceRefresh: boolean = false
    ): Promise<Token_Historic_Price | undefined> {
        try {
            //----------------------------
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (isADA) {
                CS = '';
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_log(1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_SpecificDay - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - time: ${time} - Init`
            );
            //--------------------------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                const historic_price: Token_Historic_Price = { priceADAx1e6, date: time };
                //----------------------------
                console_log(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_SpecificDay - ${showData(historic_price)} - response OK`);
                //----------------------------
                return historic_price;
            }
            //----------------------------
            const date = endOfDay(new Date(Number(time)));
            //----------------------------
            let priceHistoricDB: PriceHistoricEntity | undefined = undefined;
            //----------------------------
            const optionsGet: OptionsGet = {
                fieldsForSelect: { priceADAx1e6: true, date: true },
                doCallbackAfterLoad: false,
                loadRelations: {},
                checkRelations: false,
                sort: { date: -1 },
            };
            //----------------------------
            if (forceRefresh === false) {
                //----------------------------
                const query = {
                    CS,
                    TN_Hex,
                    date: endOfDay(date).toISOString(),
                };
                //----------------------------
                priceHistoricDB = await this.getOneByParams_(query, optionsGet);
            }
            //----------------------------
            if (priceHistoricDB !== undefined) {
                //----------------------------
                const historic_price: Token_Historic_Price = { priceADAx1e6: priceHistoricDB.priceADAx1e6!, date: BigInt(priceHistoricDB.date!.getTime()) };
                //----------------------------
                console_log(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_SpecificDay - ${showData(historic_price)} - response OK`);
                //----------------------------
                return historic_price;
                //----------------------------
            } else {
                //----------------------------
                // no existe registro de este dia
                //----------------------------
                // TODO: en mainnet voy a pedir al oraculo el precio de ese dia
                //----------------------------
                // aqui lo que hago es pedir el antes y el despues
                // si existen ambos interpolo
                // si hay after, calculo el anterior, etc
                //----------------------------
                const queryBefore = {
                    CS,
                    TN_Hex,
                    date: {
                        $lte: endOfDay(date).toISOString(),
                    },
                };
                //----------------------------
                let priceHistoricDB_Before: PriceHistoricEntity | undefined = await this.getOneByParams_(queryBefore, { ...optionsGet, sort: { date: -1 } });
                //----------------------------
                const beforeToken: Token_Historic_Price | undefined =
                    priceHistoricDB_Before !== undefined ? { priceADAx1e6: priceHistoricDB_Before.priceADAx1e6!, date: BigInt(priceHistoricDB_Before.date!.getTime()) } : undefined;
                //----------------------------
                let afterToken: Token_Historic_Price | undefined = lastToken;
                //----------------------------
                if (afterToken === undefined) {
                    const queryAfter = {
                        CS,
                        TN_Hex,
                        date: {
                            $gte: endOfDay(date).toISOString(),
                        },
                    };
                    //----------------------------
                    let priceHistoricDB_After: PriceHistoricEntity | undefined = await this.getOneByParams_(queryAfter, { ...optionsGet, sort: { date: 1 } });
                    //----------------------------
                    afterToken =
                        priceHistoricDB_After !== undefined
                            ? { priceADAx1e6: priceHistoricDB_After.priceADAx1e6!, date: BigInt(priceHistoricDB_After.date!.getTime()) }
                            : undefined;
                }
                //----------------------------
                try {
                    const historic_prices: Token_Historic_Price[] = await PriceHistoricBackEndApplied.fillGap(date.getTime(), date.getTime(), beforeToken, afterToken);
                    //----------------------------
                    historic_prices.map(async (historic_price) => {
                        //----------------------------
                        const newEntity = new PriceHistoricEntity();
                        newEntity.CS = CS;
                        newEntity.TN_Hex = TN_Hex;
                        newEntity.date = new Date(Number(historic_price.date));
                        newEntity.priceADAx1e6 = historic_price.priceADAx1e6;
                        //----------------------------
                        await this.create(newEntity);
                        //----------------------------
                    });
                    //----------------------------
                    const historic_price: Token_Historic_Price = historic_prices[0];
                    //----------------------------
                    console_log(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_SpecificDay - ${showData(historic_price)} - response OK`);
                    //----------------------------
                    return historic_price;
                    //----------------------------
                } catch (error) {
                    console_error(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_SpecificDay - Error: ${error}`);
                    return undefined;
                }
            }
            //----------------------------
        } catch (error) {
            console_error(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3_SpecificDay - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async get_Tokens_Historic_PriceADAx1e6x1e3_LastDays(CS: CS, TN_Hex: TN, days: number = 90, forceRefresh: boolean = false): Promise<Token_Historic_Price[]> {
        try {
            //----------------------------
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (isADA) {
                CS = '';
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_log(1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_LastDays - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - days ${days} - Init`);
            //----------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            const serverTimeDate = new Date(serverTime);
            //--------------------------------------
            let fromDate = endOfDay(serverTimeDate);
            fromDate.setDate(fromDate.getDate() - days);
            //----------------------------
            let toDate = endOfDay(serverTimeDate);
            toDate.setDate(toDate.getDate() - 1);
            //----------------------------
            // delete the entry for today, because ill update with new time from now
            // no hace falta, por que no guardo el del dia de hoy nunca
            //----------------------------
            // await this.deleteByParams_({
            //     CS,
            //     TN_Hex,
            //     date: {
            //         $gte: startOfDay(serverTimeDate).toISOString(),
            //     },
            // });
            //----------------------------
            // cargo el precio actual de la base de precios
            //----------------------------
            const tokenToday: Token_With_Price_And_Date_And_Signature | undefined = await PriceBackEndApplied.get_Token_With_Price_And_Signature(
                CS,
                TN_Hex,
                forceRefresh,
                VALID_APROXIMATED_PRICE_TIME_MS
            );
            //----------------------------
            if (tokenToday === undefined || tokenToday.date === undefined || tokenToday.priceADAx1e6 === undefined) {
                throw 'Unexpected scenario: No price today';
            }
            //----------------------------
            const historic_price_Today: Token_Historic_Price = { priceADAx1e6: tokenToday.priceADAx1e6, date: tokenToday.date };
            //----------------------------
            // cargo desde la base de historicos, desde from hasta yersterday
            //----------------------------
            const historic_prices: Token_Historic_Price[] = await this.get_Tokens_Historic_PriceADAx1e6x1e3_From_To(
                CS,
                TN_Hex,
                BigInt(fromDate.getTime()),
                BigInt(toDate.getTime()),
                historic_price_Today,
                forceRefresh
            );
            //----------------------------
            historic_prices.push(historic_price_Today);
            //----------------------------
            console_log(-1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_LastDays - Token Historic Lenght: ${showData(historic_prices.length)} - response OK`
            );
            //----------------------------
            return historic_prices.sort((a, b) => Number(a.date - b.date));
            //----------------------------
        } catch (error) {
            console_error(-1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_LastDays - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async get_Tokens_Historic_PriceADAx1e6x1e3_From_To(
        CS: CS,
        TN_Hex: TN,
        from: POSIXTime,
        to: POSIXTime,
        lastToken: Token_Historic_Price | undefined,
        forceRefresh: boolean = false
    ): Promise<Token_Historic_Price[]> {
        try {
            //----------------------------
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (isADA) {
                CS = '';
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //----------------------------
            if (isFrontEndEnvironment()) {
                throw `Can't run this method in the Browser`;
            }
            //----------------------------
            console_log(1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_From_To - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - from ${from} - to ${to} - Init`
            );
            //----------------------------
            let fromDate = endOfDay(new Date(Number(from)));
            //----------------------------
            let toDate = endOfDay(new Date(Number(to)));
            //----------------------------
            if (isADA) {
                const priceADAx1e6 = 1_000_000n;
                //----------------------------
                // fill historic_prices in that perdio fromDate to Date, with priceADAx1e6
                //----------------------------
                const historic_prices: Token_Historic_Price[] = [];
                //----------------------------
                for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
                    //----------------------------
                    const newToken: Token_Historic_Price = { priceADAx1e6, date: BigInt(d.getTime()) };
                    //----------------------------
                    historic_prices.push(newToken);
                    //----------------------------
                }
                //----------------------------
                console_log(-1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_From_To - Token Historic Lenght: ${showData(historic_prices.length)} - response OK`
                );
                //----------------------------
                return historic_prices.sort((a, b) => Number(a.date - b.date));
            }
            //----------------------------
            // * el chart no deberia crear un valor de FT rambom. Al menos el ultimo valor debe coincidir con el valor actual en base a el valor de los tokens que lo forman.
            // * si hubiera faltantes en el medio, en el historial, debe crear una funcion lineal para unirlos con sierto marjen de ramdom en el medio.
            // * si hay faltantes al final, tambien una funcion lineal entre el ultimo que exita y el del dia, calculado a partir de los tokens
            // * si faltan todos los valores, y tengo solo el del dia de hoy, como cuando inica el sitio, crearlos ramdom pero hacia atras
            //----------------------------
            // get all the historic prices
            //----------------------------
            const query = {
                CS,
                TN_Hex,
                date: {
                    $gte: endOfDay(fromDate).toISOString(),
                    $lte: endOfDay(toDate).toISOString(),
                },
            };
            //----------------------------
            const optionsGet: OptionsGet = {
                fieldsForSelect: { priceADAx1e6: true, date: true },
                doCallbackAfterLoad: false,
                loadRelations: {},
                checkRelations: false,
                sort: { date: -1 },
            };
            //----------------------------
            let priceHistoricDB: PriceHistoricEntity[] = [];
            //----------------------------
            if (forceRefresh === false) {
                priceHistoricDB = await this.getByParams_(query, optionsGet);
            }
            //----------------------------
            if (priceHistoricDB.length === daysBetweenDates(fromDate, toDate)) {
                //----------------------------
                const historic_prices: Token_Historic_Price[] = priceHistoricDB.map((item) => {
                    return { priceADAx1e6: item.priceADAx1e6!, date: BigInt(item.date!.getTime()) } as Token_Historic_Price;
                });
                //----------------------------
                console_log(-1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_From_To - Token Historic Lenght: ${showData(historic_prices.length)} - response OK`
                );
                //----------------------------
                return historic_prices.sort((a, b) => Number(a.date - b.date));
                //----------------------------
            }
            //----------------------------'
            // TODO: en mainnet tengo que revisar si esta completa y si no tengo que pedir al oraculo los dias que falten
            // en emulador y testnet voy a generar random esos valores que faltan
            //----------------------------
            // const dateBefore = new Date().setDate(date.getDate() - 1);
            // const dateAfter = new Date().setDate(date.getDate() + 1);
            //----------------------------
            const queryBefore = {
                CS,
                TN_Hex,
                date: {
                    $lte: endOfDay(fromDate).toISOString(),
                },
            };
            //----------------------------
            let priceHistoricDB_Before: PriceHistoricEntity | undefined = await this.getOneByParams_(queryBefore, { ...optionsGet, sort: { date: -1 } });
            //----------------------------
            const beforeToken: Token_Historic_Price | undefined =
                priceHistoricDB_Before !== undefined ? { priceADAx1e6: priceHistoricDB_Before.priceADAx1e6!, date: BigInt(priceHistoricDB_Before.date!.getTime()) } : undefined;
            //----------------------------
            let afterToken: Token_Historic_Price | undefined = lastToken;
            //----------------------------
            if (afterToken === undefined) {
                const queryAfter = {
                    CS,
                    TN_Hex,
                    date: {
                        $gte: endOfDay(toDate).toISOString(),
                    },
                };
                //----------------------------
                let priceHistoricDB_After: PriceHistoricEntity | undefined = await this.getOneByParams_(queryAfter, { ...optionsGet, sort: { date: 1 } });
                //----------------------------
                afterToken =
                    priceHistoricDB_After !== undefined ? { priceADAx1e6: priceHistoricDB_After.priceADAx1e6!, date: BigInt(priceHistoricDB_After.date!.getTime()) } : undefined;
            }
            //----------------------------
            // Create a map to easily check if data exists for a specific day.
            //----------------------------
            const existingDates = new Map(
                priceHistoricDB.map((item) => [item.date.getTime(), { priceADAx1e6: item.priceADAx1e6 ?? 0n, date: BigInt(item.date.getTime()) } as Token_Historic_Price])
            );
            if (!existingDates.has(Number(from)) && beforeToken !== undefined) {
                existingDates.set(Number(from), beforeToken);
            }
            if (!existingDates.has(Number(to)) && afterToken !== undefined) {
                existingDates.set(Number(to), afterToken);
            }
            const historic_prices: Token_Historic_Price[] = [];
            //----------------------------
            for (let d = new Date(toDate); d >= fromDate; d.setDate(d.getDate() - 1)) {
                //----------------------------
                const time = d.getTime();
                //----------------------------
                if (existingDates.has(time)) {
                    const token = existingDates.get(time);
                    historic_prices.push(token!);
                }
            }
            //----------------------------
            // Create a sorted array of existing dates
            //----------------------------
            const allTimes = Array.from(existingDates.keys()).sort((a, b) => b - a); // Descending order
            //----------------------------
            // Identify missing gaps
            let missingGaps: Array<[number, number]> = [];
            let gapStart: number | null = null;
            //----------------------------
            for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
                //----------------------------
                const time = d.getTime();
                //----------------------------
                if (!existingDates.has(time)) {
                    gapStart = gapStart === null ? time : gapStart;
                } else if (gapStart !== null) {
                    missingGaps.push([gapStart, new Date(time).setDate(new Date(time).getDate() - 1)]);
                    gapStart = null;
                }
            }
            //----------------------------
            if (gapStart !== null) {
                missingGaps.push([gapStart, toDate.getTime()]);
            }
            //----------------------------
            // Process each missing gap
            //----------------------------
            for (let [gapStart, gapEnd] of missingGaps) {
                //----------------------------
                // console.log('All times in descending order: ', allTimes);
                // console.log('All times in ascending order: ', allTimesReverse);
                console_log(0, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_From_To - Gap Start: ${gapStart}, Gap End: ${gapEnd}`);
                //----------------------------
                const beforeTime = allTimes.find((t) => t < gapStart);
                const afterTime = [...allTimes].reverse().find((t) => t > gapEnd);
                //----------------------------
                console_log(0, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_From_To - Before Time: ${beforeTime}, After Time: ${afterTime}`);
                //----------------------------
                const beforeToken = beforeTime !== undefined ? existingDates.get(beforeTime) : undefined;
                const afterToken = afterTime !== undefined ? existingDates.get(afterTime) : undefined;
                //----------------------------
                const gap_historic_prices: Token_Historic_Price[] = await PriceHistoricBackEndApplied.fillGap(gapStart, gapEnd, beforeToken, afterToken);
                //----------------------------
                for (const historic_price of gap_historic_prices) {
                    //----------------------------
                    const newEntity = new PriceHistoricEntity();
                    newEntity.CS = CS;
                    newEntity.TN_Hex = TN_Hex;
                    newEntity.date = new Date(Number(historic_price.date));
                    newEntity.priceADAx1e6 = historic_price.priceADAx1e6;
                    //----------------------------
                    await this.create(newEntity);
                    //----------------------------
                    existingDates.set(Number(historic_price.date), historic_price);
                    historic_prices.push(historic_price);
                }
            }
            //----------------------------
            //console.log(toJson(historic_prices));
            //----------------------------
            console_log(-1, this._Entity.className(), `get_Token_Historic_PriceADAx1e6x1e3 - Token Historic Lenght: ${showData(historic_prices.length)} - response OK`);
            //----------------------------
            return historic_prices.sort((a, b) => Number(a.date - b.date));
            //----------------------------
        } catch (error) {
            console_error(-1, this._Entity.className(), `get_Tokens_Historic_PriceADAx1e6x1e3_LastDays - Error: ${error}`);
            throw `${error}`;
        }
    }

    public static async get_Token_Change_24_Percent(CS: CS, TN_Hex: TN, forceRefresh: boolean = false): Promise<number | undefined> {
        try {
            //----------------------------
            if (CS === undefined || TN_Hex === undefined) {
                throw `CS or TN not defined`;
            }
            const isADA = isTokenADA(CS, TN_Hex);
            if (isADA) {
                CS = '';
            }
            if (!isToken_CS_And_TN_Valid(CS, TN_Hex)) {
                throw `CS or TN not valid`;
            }
            //----------------------------
            console_log(1, this._Entity.className(), `get_Token_Change_24_Percent - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - Init`);
            //----------------------------
            const serverTime = await TimeBackEnd.getServerTime();
            const serverTimeDate = new Date(serverTime);
            //--------------------------------------
            if (isADA) {
                console_log(0, this._Entity.className(), `get_Token_Change_24_Percent - ADA change 24: 0% - response OK`);
                return 0;
            }
            //----------------------------
            const tokenToday: Token_With_Price_And_Date_And_Signature | undefined = await PriceBackEndApplied.get_Token_With_Price_And_Signature(
                CS,
                TN_Hex,
                forceRefresh,
                VALID_APROXIMATED_PRICE_TIME_MS
            );
            //----------------------------
            if (tokenToday === undefined || tokenToday.date === undefined || tokenToday.priceADAx1e6 === undefined) {
                throw 'Unexpected scenario: No price today';
            }
            //----------------------------
            const historic_price_Today: Token_Historic_Price = { priceADAx1e6: tokenToday.priceADAx1e6, date: tokenToday.date };
            //----------------------------
            // Fetch the last day data (assuming sorted by date in descending order)
            //----------------------------
            let fromDate = endOfDay(serverTimeDate);
            fromDate.setDate(fromDate.getDate() - 1);
            //----------------------------
            const historic_price_Yesterday: Token_Historic_Price | undefined = await this.get_Token_Historic_PriceADAx1e6x1e3_SpecificDay(
                CS,
                TN_Hex,
                BigInt(fromDate.getTime()),
                historic_price_Today,
                forceRefresh
            );
            //----------------------------
            // Check if we have enough data points for the calculation
            if (historic_price_Yesterday === undefined) {
                console_log(-1, this._Entity.className(), `get_Token_Change_24_Percent - Yesterday missing data - response OK`);
                return undefined;
            }
            //----------------------------
            // Calculate the percentage change
            //----------------------------
            const oldPrice = historic_price_Yesterday.priceADAx1e6;
            const newPrice = historic_price_Today.priceADAx1e6;
            //----------------------------
            const changePercent = (Number(newPrice - oldPrice) * 100) / Number(oldPrice);
            //----------------------------
            console_log(0, this._Entity.className(), `get_Token_Change_24_Percent - oldPrice: ${oldPrice} - newPrice: ${newPrice}`);
            //----------------------------
            const result = Math.floor(changePercent * 100) / 100;
            //----------------------------
            console_log(-1, this._Entity.className(), `get_Token_Change_24_Percent - ${formatHash(CS)}, ${hexToStr(TN_Hex)} - change 24: ${result}% - response OK`);
            //----------------------------
            return result;
            //----------------------------
        } catch (error) {
            console_error(-1, this._Entity.className(), `get_Token_Change_24_Percent - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion class methods
}
