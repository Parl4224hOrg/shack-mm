import {getChannels} from "../commandPermission";

test('channel test', () => {
    expect(getChannels(['1234'])).toBe('<#1234>');
    expect(getChannels(['1234', '12345'])).toBe('<#1234> and <#12345>');
    expect(getChannels(['1234', '12345', '123456'])).toBe('<#1234>, <#12345>, and <#123456>');
})
