import {grammaticalTime} from "../grammatical";

test('seconds', () => {
    expect(grammaticalTime(20)).toBe('20 seconds');
});


test('minutes', () => {
    expect(grammaticalTime(120)).toBe('2 minutes, and 0 seconds');
});


test('hours', () => {
    expect(grammaticalTime(7210)).toBe('2 hours, 0 minutes, and 10 seconds');
});


test('days', () => {
    expect(grammaticalTime(172800)).toBe('2 days, 0 hours, 0 minutes, and 0 seconds');
});
