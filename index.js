require('@shopify/shopify-api/adapters/node');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { authorize, redirect } = require('./shopifyOAuthHelper')

dotenv.config();

const app = express();
const port = 3215;

// Parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Shopify App Configuration
const shopify = shopifyApi({
    apiKey: process.env.client_id,
    apiSecretKey: process.env.client_secret,
    scopes: process.env.scopes.split(','),
    hostName: process.env.SHOPIFY_HOSTNAME,
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: false
});

app.get('/api/shopify/authorize', async (req, res) => {

    // console.log(req.params.shop);

    return res.redirect(await authorize(req.query.shop))
})

app.get('/api/shopify/redirect', async (req, res) => {
    const data = await redirect(req.query.code, req.query.shop);
    return res.json(data)
})


const simplifyProducts = (data) => {
  return data.edges.map((productEdge) => {
      const product = productEdge.node;
      return {
          id: product.id,
          title: product.title,
          description: product.description,
          tags: product.tags,
          vendor: product.vendor,
          productType: product.productType,
          handle: product.handle,
          images: product.images.edges.map(
              (imageEdge) => imageEdge.node.originalSrc
          ),
          variants: product.variants.edges.map((variantEdge) => ({
              price: variantEdge.node.price,
              title: variantEdge.node.title,
              quantity: variantEdge.node.inventoryQuantity,
              options: variantEdge.node.selectedOptions.map((option) => ({
                name: option.name,
                value: option.value,
            })),
          })),
      };
  });
};


// Fetch Products using GraphQL
app.get('/api/shopify/products', async (req, res) => {
    try {
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const shop = `${req.query.shop}.myshopify.com`;

        const session = {
            shop,
            accessToken,
        }

        const client = new shopify.clients.Graphql({ session });

        const query = `
          {
            products(first: 10) {
              edges {
                node {
                  id
                  title
                  description
                  tags
                  vendor
                  productType
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        originalSrc
                        altText
                      }
                    }
                  }
                  variants(first: 5) {
                    edges {
                      node {
                        price
                        title
                        inventoryQuantity
                        selectedOptions {
                          name
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await client.query({ data: query });
        // res.json(response.body.data.products);

        const simplifiedProducts = simplifyProducts(response.body.data.products);
        res.json(simplifiedProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`App is running on port: ${port}`);
});
