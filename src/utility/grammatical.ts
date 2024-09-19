export const grammaticalList = (strings: string[]) => {
    let output = '';
    strings.forEach((string, index) => {
        if (index != 0) {
            if (strings.length != 2) {
                output += ', ';
            }
            if (index == strings.length - 1 && strings.length == 2) {
                output += ' and ';
            } else if (index == strings.length - 1) {
                output += 'and '
            } else {
                output += '';
            }
        }
        output += string;
    })
    return output;
}

const divmod = (x: number, y: number) => [Math.floor(x / y), x % y];

const grammaticalMinutes = (timeDiff: number) => {
    const div = divmod(timeDiff, 60);
    if (div[0] == 1) {
        if (div[1] == 1) {
            return `1 minute, and 1 second`;
        } else {
            return `1 minute, and ${div[1]} seconds`;
        }
    } else {
        if (div[1] == 1) {
            return `${div[0]} minutes, and 1 second`;
        } else {
            return `${div[0]} minutes, and ${div[1]} seconds`;
        }
    }
}

const grammaticalHours = (timeDiff: number) => {
    const div = divmod(timeDiff, 3600);
    if (div[0] == 1) {
        return `1 hour, ${grammaticalMinutes(div[1])}`;
    } else {
        return `${div[0]} hours, ${grammaticalMinutes(div[1])}`;
    }
}

const grammaticalDays = (timeDiff: number) => {
    const div = divmod(timeDiff, 86400);
    if (div[0] == 1) {
        return `1 day, ${grammaticalHours(div[1])}`;
    } else {
        return `${div[0]} days, ${grammaticalHours(div[1])}`;
    }
}

const grammaticalWeeks = (timeDiff: number) => {
    const div = divmod(timeDiff, 604800);
    if (div[0] == 1) {
        return `1 week, ${grammaticalDays(div[1])}`;
    } else {
        return `${div[0]} weeks, ${grammaticalDays(div[1])}`;
    }
}

export const grammaticalTime = (timeDiff: number) => {
    if (timeDiff == 1) {
        return '1 Second';
    } else if (timeDiff < 60) {
        return `${timeDiff} seconds`;
    // Less than an hour
    } else if (timeDiff < 3600) {
        return grammaticalMinutes(timeDiff);
    // Less than a day
    } else if (timeDiff < 86400) {
        return grammaticalHours(timeDiff);
    // Less than a week
    } else if (timeDiff < 604800) {
        return grammaticalDays(timeDiff);
    // Over a week
    } else {
        return grammaticalWeeks(timeDiff);
    }
}

export const getEditDistance = (a: string, b: string): number => {
    if (a == null) return 1000;
    if (b == null) return 1000;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) == a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                    Math.min(matrix[i][j-1] + 1, // insertion
                        matrix[i-1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};
