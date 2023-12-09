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

export const getGraph = async (history: number[], start: number, end: number, username: string) => {
    const games = history.slice(start, end);
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

