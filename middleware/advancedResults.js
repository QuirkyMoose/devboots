const advancedResults = (model, populate) => async (req, res, next) => {

    let query;
    const reqQuery = {...req.query}; // copy req.query into reqQuery
    const removeFields = ['select','sort','limit','page'] // specify fields to delete from reqQuery
    //mongo treats parameters in our queries as fields, but select and a couple other keywords aren't fields in out database, we need to remove it from our copied query object so the keywords can maintain its characteristics 

    removeFields.forEach(param => delete reqQuery[param]) // remove specified fields from reqQuery, these fields are special characters that enable us perform specific functions
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = model.find(JSON.parse(queryStr));

    if(req.query.select){
            let str = req.query.select.split(',').join(' ');//returns parameter passed into select ie select=name,description and then splits it on the comma and then joins it with a space, returns the results into the variable str
            //select query syntax : query.select('name occupation')
            query = query.select(str)//query becomes query.select(str) str being the comma seperated parameters passed into select
    }

    if(req.query.sort){
            let sortBy = req.query.sort.split(',').join(' ')
            query = query.sort(sortBy)
    }

    //Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit; //first item on page
    const endIndex = page * limit; //last item on page
    const total = await model.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    if(populate){
            query = query.populate(populate);
    }

    //Execute Query
    const results = await query;
    
    //pagination result
    const pagination = {};

    if(endIndex < total){
            pagination.next = {
                    page: page + 1,
                    limit
            }
    }
    if(startIndex > 0 && results != ''){
            pagination.prev = {
                    page: page - 1,
                    limit
            }
    }

    res.advancedResults = {
            success: true,
            count: results.length,
            pagination,
            data: results
    }

    next();
}

module.exports = advancedResults;