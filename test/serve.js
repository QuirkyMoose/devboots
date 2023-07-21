const http = require('http')
const PORT = 5000;

const TODO = [
    {id: 1, text: 'Todo one'},
    {id: 2, text: 'Todo two'},
    {id: 3, text: 'Todo three'}

]

const server = http.createServer((req,res)=> {
    const {method,url} = req;
    let body = [];

    req
    .on('data', (chunk)=>{
        body.push(chunk)
    }).on('end', ()=>{
        body = Buffer.concat(body).toString();

        let status = 404;
        const response = {
            success: false,
            data: null,
            error: null
        }

        if (method === 'GET'  && url === '/todos'){
            status = 200;
            response.success = true;
            response.data = TODO;
        }else if(method === 'POST' && url === '/todos'){
            const {id,text}= JSON.parse(body);
            if(!id || !text){
                status = 400;
                response.error = 'Please add id and text'
            }else{

                TODO.push({id,text});
                status = 201;
                response.success = true;
                response.data = TODO;

            }

        }

        res.writeHead(status, {
            'Content-Type':'application/json',
            'X-Powered-By':'Node.js'
        })
        res.end(JSON.stringify(response))

    })
   
})

server.listen(PORT, ()=>{ console.log(`server listening on ${PORT}`)})