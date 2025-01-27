const express = require("express")
var bodyParser = require("body-parser")
require('dotenv').config()
const axios = require('axios')
const { authorize, redirect } = require('./shopifyOAuthHelper')

var port = 3215

var app = express()

app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(bodyParser.json());

app.listen(port, () => {
    console.log("app is running on post :", port);
})

app.get('/api/shopify/authorize', async (req, res) => {
   
    // console.log(req.params.shop);
    
    return res.redirect(await authorize(req.query.shop))
})

app.get('/api/shopify/redirect', async (req, res) => {
    return res.json(await redirect(req.query.code, req.query.shop))
})


app.get('/api/shopify/products', async (req, res) => {
    try {
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN; 
      const shop = req.query.shop;
  
      if (!shop) {
        return res.status(400).json({ error: 'Missing "shop" parameter' });
      }
  
      const productsEndpoint = `https://${req.query.shop}.myshopify.com/admin/api/2023-07/products.json`;
  
      const response = await axios.get(productsEndpoint, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      return res.status(200).json(response.data);
    } catch (err) {
      console.error('Error fetching products:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  