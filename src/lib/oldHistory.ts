export const history: HistoricalEntry[] = [
    {
        name: "2023/05/05",
        metadata: {
            preShowStart: "2023-05-06T00:47:34.000Z",
            mainShowStart: "2023-05-06T00:55:19.000Z",
            showEnd: "2023-05-06T04:00:35.000Z"
        }
    },
    {
        name: "2023/4/28",
        metadata: {
            preShowStart: "2023-04-29T00:44:31.000Z",
            mainShowStart: "2023-04-29T00:49:31.000Z",
            showEnd: "2023-04-29T04:31:10.000Z"
        }
    },
    {
        name: "2023/4/21",
        metadata: {
            preShowStart: "2023-04-22T00:58:35.000Z",
            mainShowStart: "2023-04-22T01:02:17.000Z",
            showEnd: "2023-04-22T04:37:52.000Z"
        }
    },
    {
        name: "2023/4/14",
        metadata: {
            preShowStart: "2023-04-15T02:18:43.000Z",
            mainShowStart: "2023-04-15T02:44:14.000Z",
            showEnd: "2023-04-15T06:40:17.000Z"
        }
    }
];



type HistoricalEntry = {
    name: string,
    metadata: {
        preShowStart: string,
        mainShowStart: string,
        showEnd: string
    }
}