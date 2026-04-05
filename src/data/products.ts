export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  desc: string;
  image: string;
  badge?: string;
}

export const PRODUCTS: Product[] = [
  // Cupcakes - all 3 main ones use local AI-generated images, rest use working food CDN
  { id: 1, name: 'Vanilla Cupcake', category: 'cupcakes', price: 299, desc: 'Classic fluffy vanilla cupcake with rich buttercream frosting. Box of 6.', image: '/images/vanilla-cupcake.png' },
  { id: 2, name: 'Red Velvet Cupcake', category: 'cupcakes', price: 299, desc: 'Velvety cocoa-infused cupcake with creamy cream cheese frosting. Box of 6.', image: '/images/red-velvet-cupcake.png', badge: 'Popular' },
  { id: 3, name: 'Chocolate Cupcake', category: 'cupcakes', price: 309, desc: 'Deep chocolate cupcake for the ultimate cocoa lover. Box of 6.', image: '/images/chocolate-cupcake.png' },
  { id: 4, name: 'Strawberry Cupcake', category: 'cupcakes', price: 319, desc: 'Fruity strawberry cupcake made with real fruit puree. Box of 6.', image: 'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 5, name: 'Mix Cupcakes', category: 'cupcakes', price: 349, desc: 'Assorted box of our best-selling cupcake flavours. Box of 6.', image: 'https://images.pexels.com/photos/7966452/pexels-photo-7966452.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },

  // Donuts - local images for cinnamon + chocolate, pexels for sugar glaze
  { id: 6, name: 'Sugar Glaze Donut', category: 'donuts', price: 80, desc: 'Classic hand-dipped sugary glazed donut.', image: 'https://images.pexels.com/photos/1191639/pexels-photo-1191639.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 7, name: 'Cinnamon Donut', category: 'donuts', price: 80, desc: 'Donut coated with a fragrant cinnamon-sugar blend.', image: '/images/cinnamon-donut.png' },
  { id: 8, name: 'Chocolate Donut', category: 'donuts', price: 90, desc: 'Rich chocolate glazed donut for an extra treat.', image: '/images/chocolate-donut.png' },

  // Filled Donuts - all local AI images
  { id: 9, name: 'Nutella Filled Donut', category: 'filled donuts', price: 130, desc: 'Donut stuffed with creamy Nutella chocolate hazelnut spread.', image: '/images/nutella-filled-donut.png', badge: 'Bestseller' },
  { id: 10, name: 'Blueberry Filled Donut', category: 'filled donuts', price: 130, desc: 'Donut with a refreshing and tangy blueberry filling.', image: '/images/blueberry-filled-donut.png' },
  { id: 11, name: 'Ganache Filled Donut', category: 'filled donuts', price: 130, desc: 'Indulgent donut filled with dark chocolate ganache.', image: '/images/ganache-filled-donut.png' },

  // Muffins - 3 local, 1 pexels
  { id: 12, name: 'Choco Chunk Muffin', category: 'muffins', price: 210, desc: 'Rich muffin with oversized chocolate chunks. Box of 6.', image: '/images/choco-chunk-muffin.png' },
  { id: 13, name: 'Blueberry Muffin', category: 'muffins', price: 210, desc: 'Classic muffin bursting with fresh blueberries. Box of 6.', image: '/images/blueberry-muffin.png' },
  { id: 14, name: 'Choco Chip Muffin', category: 'muffins', price: 210, desc: 'Golden muffin loaded with semi-sweet chocolate chips. Box of 6.', image: '/images/choco-chip-muffin.png' },
  { id: 15, name: 'Banana Walnuts Muffin', category: 'muffins', price: 210, desc: 'Moist banana muffin with crunchy walnut pieces. Box of 6.', image: 'https://images.pexels.com/photos/16248206/pexels-photo-16248206.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },

  // Teacakes - all pexels verified food IDs
  { id: 16, name: 'Banana Tea Cake', category: 'teacakes', price: 210, desc: 'Spiced banana cake, perfect for tea time.', image: '/images/banana-teacake.png' },
  { id: 17, name: 'Vanilla Tea Cake', category: 'teacakes', price: 210, desc: 'Classic vanilla sponge cake with a delicate crumb.', image: 'https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 18, name: 'Lemon Chia Tea Cake', category: 'teacakes', price: 210, desc: 'Zesty lemon cake with healthy chia seeds.', image: 'https://images.pexels.com/photos/8478182/pexels-photo-8478182.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 19, name: 'Carrot Walnut Tea Cake', category: 'teacakes', price: 249, desc: 'Traditional carrot cake with walnuts and warm spices.', image: 'https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 20, name: 'Blueberry Tea Cake', category: 'teacakes', price: 249, desc: 'Moist cake filled with seasonal blueberries.', image: 'https://images.pexels.com/photos/1291712/pexels-photo-1291712.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },

  // Brownies - 1 local, rest pexels verified
  { id: 21, name: 'Fudge Brownies', category: 'brownies', price: 300, desc: 'Rich, gooey chocolate fudge brownies. Box of 6.', image: '/images/fudge-brownie.png' },
  { id: 22, name: 'Walnut Brownies', category: 'brownies', price: 360, desc: 'Chocolate brownies with generous walnut pieces. Box of 6.', image: 'https://images.pexels.com/photos/5386663/pexels-photo-5386663.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 23, name: 'Nutella Brownies', category: 'brownies', price: 360, desc: 'Brownies swirled with rich Nutella for extra decadence. Box of 6.', image: 'https://images.pexels.com/photos/29727285/pexels-photo-29727285.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 24, name: 'Biscoff Brownies', category: 'brownies', price: 380, desc: 'Gourmet brownies with Biscoff cookie spread. Box of 6.', image: 'https://images.pexels.com/photos/29066517/pexels-photo-29066517.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 25, name: 'Oreo Brownies', category: 'brownies', price: 380, desc: 'Chocolate brownies topped with crunchy Oreo pieces. Box of 6.', image: 'https://images.pexels.com/photos/887853/pexels-photo-887853.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 26, name: 'Choco chip Brownies', category: 'brownies', price: 380, desc: 'Brownies loaded with mini chocolate chips. Box of 6.', image: 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 27, name: 'Double Chocolate Brownies', category: 'brownies', price: 400, desc: 'Extra intense double chocolate fudge brownies. Box of 6.', image: 'https://images.pexels.com/photos/30924031/pexels-photo-30924031.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },
  { id: 28, name: 'Brookies', category: 'brownies', price: 400, desc: 'The perfect marriage of brownies and chocolate chip cookies. Box of 6.', image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' },

  // Custom Cakes
  { id: 29, name: 'Customised Cake', category: 'custom cakes', price: 0, desc: 'Made specially for you - choose your flavour & size. Prices vary by design and weight.', image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', badge: 'Custom' },
];
