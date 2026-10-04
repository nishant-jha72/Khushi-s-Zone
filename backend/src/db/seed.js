const bcrypt = require("bcryptjs");

async function seedData(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Seed Categories
    const categories = [
      { name: "Dresses", slug: "dresses", description: "Elegant Anarkalis, Gowns & Everyday Dresses", image_url: "/images/cat_dresses.png" },
      { name: "Tops & Co-ords", slug: "tops", description: "Stylish Tops, Tunics & Modern Co-ord Sets", image_url: "/images/cat_tops.png" },
      { name: "Bottoms", slug: "bottoms", description: "Ethnic Skirts, Pants & Designer Bottomwear", image_url: "/images/cat_bottoms.png" },
      { name: "Accessories", slug: "accessories", description: "Embroidered Bags, Dupattas & Accessories", image_url: "/images/cat_accessories.png" }
    ];

    const categoryIdMap = {};

    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description, image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url
         RETURNING id, slug;`,
        [cat.name, cat.slug, cat.description, cat.image_url]
      );
      categoryIdMap[res.rows[0].slug] = res.rows[0].id;
    }

    // 2. Seed Women's Clothing Items
    const items = [
      {
        name: "Maroon Embroidered Anarkali Set",
        category_slug: "dresses",
        description: "Handcrafted maroon silk anarkali with delicate zari work and matching chiffon dupatta.",
        price: 3499,
        original_price: 4999,
        sizes: ["XS", "S", "M", "L", "XL"],
        type: "Ethnic Wear",
        image_url: "/images/prod_maroon_anarkali.png",
        rating: 4.9,
        is_bestseller: true
      },
      {
        name: "Ivory Cotton Kurta Set",
        category_slug: "dresses",
        description: "Pure breathable cotton ivory kurta with delicate lace detailing and matching palazzo.",
        price: 2899,
        original_price: 3999,
        sizes: ["S", "M", "L", "XL"],
        type: "Kurta Set",
        image_url: "/images/prod_ivory_kurta.jpg",
        rating: 4.8,
        is_bestseller: false
      },
      {
        name: "Sage Green Co-ord Set",
        category_slug: "tops",
        description: "Modern linen sage green tunic shirt with tailored straight trousers for effortless elegance.",
        price: 2599,
        original_price: 3499,
        sizes: ["XS", "S", "M", "L"],
        type: "Co-ord Set",
        image_url: "/images/prod_sage_coord.jpg",
        rating: 4.7,
        is_bestseller: false
      },
      {
        name: "Embroidered Velvet Potli Bag",
        category_slug: "accessories",
        description: "Traditional hand-beaded velvet potli bag with gold tassel drawstrings.",
        price: 1299,
        original_price: 1899,
        sizes: ["Free Size"],
        type: "Bags & Accessories",
        image_url: "/images/prod_potli_bag.jpg",
        rating: 4.9,
        is_bestseller: true
      },
      {
        name: "Rose Pink Silk Floral Dress",
        category_slug: "dresses",
        description: "Graceful rose pink chanderi silk dress with printed floral motifs and waist tie belt.",
        price: 3899,
        original_price: 5299,
        sizes: ["S", "M", "L"],
        type: "Indo-Western",
        image_url: "/images/cat_dresses.png",
        rating: 4.8,
        is_bestseller: true
      },
      {
        name: "Mustard Georgette Sharara Set",
        category_slug: "dresses",
        description: "Vibrant festival mustard georgette short kurta with flared tier sharara pants.",
        price: 4199,
        original_price: 5999,
        sizes: ["S", "M", "L", "XL"],
        type: "Ethnic Wear",
        image_url: "/images/prod_maroon_anarkali.png",
        rating: 4.9,
        is_bestseller: true
      }
    ];

    const itemIdMap = {};

    for (const item of items) {
      const catId = categoryIdMap[item.category_slug];
      const res = await client.query(
        `SELECT id FROM items WHERE name = $1;`,
        [item.name]
      );

      if (res.rows.length === 0) {
        const insRes = await client.query(
          `INSERT INTO items (name, category_id, description, price, original_price, sizes, type, image_url, rating, is_bestseller)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, name;`,
          [
            item.name,
            catId,
            item.description,
            item.price,
            item.original_price,
            item.sizes,
            item.type,
            item.image_url,
            item.rating,
            item.is_bestseller
          ]
        );
        itemIdMap[insRes.rows[0].name] = insRes.rows[0].id;
      } else {
        itemIdMap[item.name] = res.rows[0].id;
      }
    }

    // 3. Seed Demo User Account
    const defaultHashedPassword = await bcrypt.hash("Password123", 10);
    const userRes = await client.query(
      `INSERT INTO users (name, email, password, phone, address, city, state, pincode, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, is_verified = TRUE
       RETURNING id, email, name;`,
      [
        "Khushi Sharma",
        "khushi@example.com",
        defaultHashedPassword,
        "+91 98765 43210",
        "102 Lotus Avenue, Green Park",
        "New Delhi",
        "Delhi",
        "110016",
        true
      ]
    );

    const demoUserId = userRes.rows[0].id;

    // 4. Seed Demo Cart & Wishlist Items for Demo User
    const itemIds = Object.values(itemIdMap);
    if (itemIds.length >= 2) {
      await client.query(
        `INSERT INTO cart_items (user_id, item_id, quantity, size)
         VALUES ($1, $2, 1, 'M')
         ON CONFLICT (user_id, item_id, size) DO NOTHING;`,
        [demoUserId, itemIds[0]]
      );

      await client.query(
        `INSERT INTO wishlist_items (user_id, item_id)
         VALUES ($1, $2), ($1, $3)
         ON CONFLICT (user_id, item_id) DO NOTHING;`,
        [demoUserId, itemIds[0], itemIds[1]]
      );
    }

    // 5. Seed Demo Past Orders for Demo User
    const existingOrders = await client.query(
      `SELECT id FROM orders WHERE user_id = $1;`,
      [demoUserId]
    );

    if (existingOrders.rows.length === 0 && itemIds.length >= 2) {
      const order1 = await client.query(
        `INSERT INTO orders (order_number, user_id, total_amount, status, payment_method, payment_status, shipping_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id;`,
        [
          "KZ-2026-8941",
          demoUserId,
          4798.00,
          "Delivered",
          "UPI (Google Pay)",
          "Paid",
          "102 Lotus Avenue, Green Park, New Delhi, Delhi - 110016"
        ]
      );

      await client.query(
        `INSERT INTO order_items (order_id, item_id, quantity, price, size)
         VALUES ($1, $2, 1, 3499.00, 'M'), ($1, $3, 1, 1299.00, 'Free Size');`,
        [order1.rows[0].id, itemIds[0], itemIds[3] || itemIds[1]]
      );

      const order2 = await client.query(
        `INSERT INTO orders (order_number, user_id, total_amount, status, payment_method, payment_status, shipping_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id;`,
        [
          "KZ-2026-9120",
          demoUserId,
          2899.00,
          "In Transit",
          "Credit Card (HDFC)",
          "Paid",
          "102 Lotus Avenue, Green Park, New Delhi, Delhi - 110016"
        ]
      );

      await client.query(
        `INSERT INTO order_items (order_id, item_id, quantity, price, size)
         VALUES ($1, $2, 1, 2899.00, 'S');`,
        [order2.rows[0].id, itemIds[1]]
      );
    }

    await client.query("COMMIT");
    console.log("✅ Database tables initialized and seeded successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding database:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { seedData };
