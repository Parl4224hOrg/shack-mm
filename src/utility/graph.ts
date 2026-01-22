import {ChartJSNodeCanvas} from "chartjs-node-canvas";
import {ChartConfiguration} from "chart.js";

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


export const getScoreDistGraph = async (scores: string[], percents: number[], startGame: number) => {
    const data = {
        labels: scores,
        datasets: [{
            label: `Score Distribution from game ${startGame}`,
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
                    text: `Score Distribution from game ${startGame}`,
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

export const getMapWinRadarChart = async (teamA: {map: string, winRate: number}[], teamB: {map: string, winRate: number}[]) => {
    // Merge labels (keep stable order: teamA maps, then any extra from teamB)
    const labels: string[] = [];
    const pushLabel = (m: string) => {
        if (!labels.includes(m)) labels.push(m);
    };
    for (const x of teamA) pushLabel(x.map);
    for (const x of teamB) pushLabel(x.map);

    const aByMap = new Map(teamA.map(x => [x.map, x.winRate]));
    const bByMap = new Map(teamB.map(x => [x.map, x.winRate]));

    const aData = labels.map(l => aByMap.get(l) ?? 0);
    const bData = labels.map(l => bByMap.get(l) ?? 0);

    const config: ChartConfiguration<"radar", number[], string> = {
        type: "radar",
        data: {
            labels,
            datasets: [
                {
                    label: "Team A",
                    data: aData,
                    borderColor: "rgba(54, 162, 235, 1)",
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    pointBackgroundColor: "rgba(54, 162, 235, 1)",
                    pointRadius: 3,
                    borderWidth: 2,
                },
                {
                    label: "Team B",
                    data: bData,
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    pointBackgroundColor: "rgba(255, 99, 132, 1)",
                    pointRadius: 3,
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: false, // node-canvas has a fixed size
            plugins: {
                legend: { display: true, position: "top" },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed.r ?? 0;
                            return `${ctx.dataset.label}: ${(v * 100).toFixed(1)}%`;
                        },
                    },
                },
            },
            scales: {
                r: {
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: (v) => `${Number(v) * 100}%`,
                    },
                },
            },
        },
    };

    // Return an image buffer (PNG). If you prefer, return a base64 string instead.
    return canvas.renderToBuffer(config);
};

