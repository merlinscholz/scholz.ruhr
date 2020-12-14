import { Font } from '@jimp/plugin-print';
import { NowRequest, NowResponse } from '@vercel/node'
import Jimp from 'jimp';
const { join } = require('path')

export default (request: NowRequest, response: NowResponse) => {

    if(!request.query['image'] || !request.query['text']){
        response.status(400).send();
    }

    
    let canvas: Promise<Jimp>;
    let imageUrl: URL;
    try{
        imageUrl = new URL(request.query['image']);
    } catch (TypeError) {
        response.status(400).send();
    }
    let text: string = request.query['text'];
    let color: number = 0x55555580;
    let font: Promise<Font> = Jimp.loadFont(join(__dirname, 'ogimage', 'liberation-serif.fnt'));
    try{
        imageUrl = new URL(request.query['image']);
    } catch (TypeError) {
        response.status(400).send();
    }
    /*if(imageUrl.hostname !== 'scholz.ruhr'){
        response.status(400).send();
    }*/

    canvas = Jimp.read(imageUrl.href);
    
    canvas = Promise.all([canvas, font]).then(([c, f])=>{
        c = c.cover(1200, 630)
            .blur(10)
            .composite(new Jimp(1200, 630, color), 0, 0, {
                mode: Jimp.BLEND_SOURCE_OVER,
                opacitySource: 1,
                opacityDest: 1
            })
            .print(f, 150, 30,
                {
                    text: text,
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                },
                900,
                570);
        return c;
    })

    
    canvas.then(async (c)=>{
        response.status(200)
        response.setHeader('content-type', 'image/png')
        response.send(await c.getBufferAsync(Jimp.MIME_PNG));
    })
}