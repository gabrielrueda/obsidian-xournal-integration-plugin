import XournalPageItem from "./XournalPageItem";
import XournalPage from "./XournalPage";

interface Point {
    x: number;
    y: number;
}

// y = mx + b
interface Line {
    m: number;
    b: number
}

const REQUIRED_TAGS = ["color", "width"]

export default class XournalLine extends XournalPageItem {
    private points: Point[];
    private color: string;
    private width: number;
    private capStyle: string;


    constructor(attr: Record<string, any>, value: string[], page: XournalPage) {
        super(attr, value, page)
    }

    processAttr(attr: Record<string, any>): void {
        this.color = String(attr["color"])

        const widths = String(attr["width"])
        
        if((typeof widths) == "number") {
            this.width = parseFloat(widths)
        } else {
            // this.width = widths.split(" ").map(parseFloat).reduce(this.averageWidth)
            this.width = parseFloat(widths.split(" ")[0])
        }

    }
    processValue(value: string[]): void {
        this.points = this.parsePoints(value.join(""))
        // this.parsePoints(value)
    }

 
    public async serializeToCanvas(): Promise<void> {
        const ctx = this.page.getCtx()

        ctx.beginPath()
        ctx.lineWidth = this.width
        ctx.strokeStyle = this.color
        // ctx.lineCap = this.capStyle

        ctx.moveTo(this.points[0].x, this.points[0].y)

        for (let i = 1; i < this.points.length; i++){
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.stroke();
    }

    private averageWidth(widths: number[]): number {
        let outliers = this.identify_outlier_widths(widths)

        return (widths.filter((ele, ind) => !outliers.has(ind)).reduce((a, b) => a + b)) / (widths.length - outliers.size)
    }

    private parsePoints(pointsStr: string): Point[] {
        const points: Point[] = [];
        const nums = pointsStr.split(" ");

        for (let i = 0; i < nums.length; i += 2){
            points.push({x: Number(nums[i]), y: Number(nums[i+1])});
        }

        // return this.optimizePoints(points);
        return points
    }

    // private parsePoints(rawPoints: string[]): void {
    //     this.points = []

    //     let currPoint = {x: -1, y: -1}

    //     let pt = ""

    //     for (const seg of rawPoints){
    //         for (const c of seg) {
    //             if (c != ' ') {
    //                 pt += c
    //             } else {
    //                 if (currPoint.x == -1) {
    //                     currPoint.x = parseFloat(pt)
    //                 } else {
    //                     currPoint.y = parseFloat(pt)
    //                     this.points.push(currPoint)
    //                     currPoint = {x: -1, y: -1}
    //                 }
    //                 pt = ""
    //             }
    //         }
    //     }

    //     // return this.optimizePoints(points);
    //     // return points
    // }


    private optimizePoints(points: Point[]){
        const EPSILON = 25;
        let dmax = 0
        let index = 0
        const end = points.length - 1 
        const start = 0

        for(let i = 1; i < end; i++){
            let d = this.perpendicularDist(points[i], this.calcLine(points[start], points[end]))
            if(d > dmax) {
                index = i
                dmax = d
            }
        }

        let newPoints: Point[];

        if(dmax > EPSILON) {
            const newPoints1 = this.optimizePoints(points.slice(0, index + 1))
            const newPoints2 = this.optimizePoints(points.slice(index, end + 1))

            newPoints = newPoints1.slice(0, -1).concat(newPoints2)
        } else {
            newPoints = points;
        }

        return newPoints;

        
    }

    private calcLine(p1: Point, p2: Point): Line {
        const m = (p2.y - p1.y) / (p2.x - p1.x)
        const b = p1.y - (m * p1.x)

        return {m: m, b: b}
    }

    private perpendicularDist(point: Point, line: Line): number {
        return Math.abs(line.m * point.x - point.y + line.b) / Math.sqrt(point.x * point.x + 1)
    }

    private identify_outlier_widths(widths: number[]) : Set<number> {
        const TARGET_Z = 1.5
        if(widths.length == 1) {
            return new Set<number>;
        }

        const n = widths.length
        const mean = (widths.reduce((a, b) => a + b)) / n
        const sd =  Math.pow((widths.reduce((a,b) => a + Math.pow((b - mean), 2)) / (n - 1)), 0.5)
         
        let outliers = new Set<number>();

        for(let i = 0; i< n; i++){
            const z_score = (widths[i] - mean) / sd
            if(Math.abs(z_score) > TARGET_Z){
                outliers.add(i)
            }
        }

        return outliers
    }
}