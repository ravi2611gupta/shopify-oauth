const axios = require('axios')

const authorize = async (shop) => {
    return encodeURI(`https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${process.env.client_id}&scope=${process.env.scopes}&redirect_uri=${process.env.redirect_uri}`)
}

const redirect = async (code, shop) => {
    let shopifyOAuthUri = `https://${shop}/admin/oauth/access_token?client_id=${process.env.client_id}&client_secret=${process.env.client_secret}&code=${code}`
    const { data } = await axios.post(shopifyOAuthUri).then((res) => {
        // console.log("response > >> >>> :", res);
        return res
    }).catch((error) => {
        return error
    })

    // return JSON.stringify(data);
    return data;
}


module.exports = {
    authorize,
    redirect
}