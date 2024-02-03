import {ChartJSNodeCanvas} from "chartjs-node-canvas";

const width = 1000;
const height = 600;
const backgroundColour = 'rgba(49, 51, 56, 1.0)';
const canvas = new ChartJSNodeCanvas({width, height, backgroundColour});

const down = (ctx: any) => ctx.p0.parsed.y > ctx.p1.parsed.y ? 'rgb(182,2,15)' : 'rgb(0, 176, 0)';
const white = 'rgb(255, 255, 255)';

const chartAreaBorder = {
    id: 'chartAreaBorder',
    beforeDraw(chart: any, args: any, options: any) {
        const {ctx, chartArea: {left, top, width, height}} = chart;
        ctx.save();
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.strokeRect(left, top, width, height);
        ctx.restore();
    }
};

const tickSettings = {
    color: white,
    font: {
        size: 20
    }
};
const axisTitle = (title: string) => {
    return {
        display: true,
        text: title,
        color: white,
        font: {
            size: 25,
        }
    }
};

const gridSettings = {
    display: false,
};

const options = (max: number, min: number, username: string) => {
    return {
        fill: false,
        interaction: {
            intersect: false
        },
        radius: 0,
        color: 'rgb(0, 0, 0)',
        scales: {
            x: {
                ticks: tickSettings,
                grid: gridSettings,
                title: axisTitle("Game Number"),
            },
            y: {
                ticks: tickSettings,
                grid: gridSettings,
                title:
                axisTitle("Rating"),
                suggestedMax: max + 10,
                suggestedMin: min - 10,
            }
        },
        plugins: {
            legend: {
                display: false,
                labels: {
                    display: false,
                    color: white,
                    padding: 20,
                    font: {
                        size: 30,
                    }
                }
            },
            title: {
                display: true,
                text: username,
                color: white,
                font: {
                    size: 30,
                },
                padding: {
                    top: 10,
                    bottom: 10
                }
            },
            chartAreaBorder: {
                borderColor: white,
                borderWidth: 2,
            }
        }
    }
};

export const getMMRGraph = async (history: number[], start: number, end: number, username: string) => {
    const games = history.slice(start, end + 1);
    let labels: string[] = []
    let count = start;
    for (const {} of games) {
        labels.push(String(count));
        count++;
    }
    const config: any = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${username}'s Rating History`,
                data: games,
                borderColor: white,
                segment: {
                    borderColor: (ctx: any) => down(ctx),
                },
                spanGaps: true
            }]
        },
        options: options(Math.max.apply(Math, games), Math.min.apply(Math, games), username),
        plugins: [chartAreaBorder]
    };
    return await canvas.renderToBuffer(config);
}


export const getScoreDistGraph = async (scores: string[], percents: number[]) => {
    const data = {
        labels: scores,
        datasets: [{
            label: "Score Distribution",
            data: percents,
            backgroundColor: [
                'rgba(255, 36, 58, 0.2)', // Master
                'rgba(79, 32, 15, 0.2)', // Wood
                'rgba(163, 87, 65, 0.2)', // Copper
                'rgba(102, 99, 91, 0.2)', // Iron
                'rgba(176, 129, 56, 0.2)', // Bronze
                'rgba(170, 169, 173, 0.2)', // Silver
                'rgba(255, 215, 0, 0.2)', // Gold
                'rgba(36, 161, 142, 0.2)', // Platinum
                'rgba(0, 195, 255, 0.2)', // Diamond
                'rgba(255, 36, 58, 0.2)', // Master
            ],
            borderColor: [
                'rgba(255, 36, 58, 1)', // Master
                'rgba(79, 32, 15, 1)', // Wood
                'rgba(163, 87, 65, 1)', // Copper
                'rgba(102, 99, 91, 1)', // Iron
                'rgba(176, 129, 56, 1)', // Bronze
                'rgba(170, 169, 173, 1)', // Silver
                'rgba(255, 215, 0, 1)', // Gold
                'rgba(36, 161, 142, 1)', // Platinum
                'rgba(0, 195, 255, 1)', // Diamond
                'rgba(255, 36, 58, 1)', // Master
            ],
            borderWidth: 1
        }]
    };

    const config: any = {
        type: 'bar',
        data: data,
        options: {
            scales: {
                x: {
                    ticks: tickSettings,
                    grid: gridSettings,
                    title: axisTitle("Score"),
                },
                y: {
                    beginAtZero: true,
                    ticks: tickSettings,
                    grid: gridSettings,
                    title: axisTitle("Percentage"),
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        display: false,
                        color: white,
                        padding: 20,
                        font: {
                            size: 30,
                        }
                    }
                },
                title: {
                    display: true,
                    text: "Score Distribution",
                    color: white,
                    font: {
                        size: 30,
                    },
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                },
                chartAreaBorder: {
                    borderColor: white,
                    borderWidth: 2,
                }
            }
        },
    }

    return await canvas.renderToBuffer(config);
}


export const getRankDistGraph = async (ranks: string[], percents: string[]) => {
    const data = {
        labels: ranks,
        datasets: [{
            label: 'Rank Distribution',
            data: percents,
            backgroundColor: [
                'rgba(79, 32, 15, 0.2)', // Wood
                'rgba(163, 87, 65, 0.2)', // Copper
                'rgba(102, 99, 91, 0.2)', // Iron
                'rgba(176, 129, 56, 0.2)', // Bronze
                'rgba(170, 169, 173, 0.2)', // Silver
                'rgba(255, 215, 0, 0.2)', // Gold
                'rgba(36, 161, 142, 0.2)', // Platinum
                'rgba(0, 195, 255, 0.2)', // Diamond
                'rgba(255, 36, 58, 0.2)', // Master
            ],
            borderColor: [
                'rgba(79, 32, 15, 1)', // Wood
                'rgba(163, 87, 65, 1)', // Copper
                'rgba(102, 99, 91, 1)', // Iron
                'rgba(176, 129, 56, 1)', // Bronze
                'rgba(170, 169, 173, 1)', // Silver
                'rgba(255, 215, 0, 1)', // Gold
                'rgba(36, 161, 142, 1)', // Platinum
                'rgba(0, 195, 255, 1)', // Diamond
                'rgba(255, 36, 58, 1)', // Master
            ],
            borderWidth: 1
        }]
    };

    const config: any = {
        type: 'bar',
        data: data,
        options: {
            scales: {
                x: {
                    ticks: tickSettings,
                    grid: gridSettings,
                    title: axisTitle("Rank"),
                },
                y: {
                    beginAtZero: true,
                    ticks: tickSettings,
                    grid: gridSettings,
                    title: axisTitle("Percentage"),
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        display: false,
                        color: white,
                        padding: 20,
                        font: {
                            size: 30,
                        }
                    }
                },
                title: {
                    display: true,
                    text: "Rank Distribution",
                    color: white,
                    font: {
                        size: 30,
                    },
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                },
                chartAreaBorder: {
                    borderColor: white,
                    borderWidth: 2,
                }
            }
        },
    };

    return await canvas.renderToBuffer(config);
}

