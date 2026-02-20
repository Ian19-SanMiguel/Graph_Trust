import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCartStore } from "../stores/useCartStore";
import { ShoppingCart } from "lucide-react";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            <img src={product.image} alt={product.name} className="w-full h-96 object-cover rounded" />
          </div>
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-gray-300 mb-4">{product.description}</p>
            <p className="text-2xl font-semibold text-accent-400 mb-6">${product.price}</p>
            <button
              className="flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 rounded"
              onClick={() => addToCart(product)}
            >
              <ShoppingCart /> Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
