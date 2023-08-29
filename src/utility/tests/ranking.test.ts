import {getRank} from "../ranking";

test('Hot Garbage', () => {
    expect(getRank(49).name).toBe("Hot Garbage")
})

test('Bronze', () => {
    expect(getRank(1320).name).toBe("Bronze");
})

test('Copper', () => {
    expect(getRank(1400).name).toBe("Copper");
})

test('Silver', () => {
    expect(getRank(1500).name).toBe("Silver");
})

test('Gold', () => {
    expect(getRank(1560).name).toBe("Gold");
})

test('Plat', () => {
    expect(getRank(1669).name).toBe("Plat");
})

test('Diamond 1', () => {
    expect(getRank(1750).name).toBe("Diamond 1");
})

test('Global Elite', () => {
    expect(getRank(2000).name).toBe("Global Elite");
})
