export const grammaticalList = (strings: string[]) => {
    let output = '';
    strings.forEach((string, index) => {
        if (index != 0) {
            if (strings.length != 2) {
                output += ',';
            }
            if (index == strings.length - 1) {
                output += ' and ';
            } else {
                output += '';
            }
        }
        output += string;
    })
    return output;
}