import CounterModel from "../../database/models/CounterModel";

export const getCounter = async (id: string) => {
    const filter = {_id: id};
    const counter = (await CounterModel.findOne(filter)) || (await CounterModel.create({
        _id: id,
        value: 0,
    }));
    const update = {value: (counter.value + 1)}
    return CounterModel.findOneAndUpdate(filter, update, {new: true, upsert: true});
}
