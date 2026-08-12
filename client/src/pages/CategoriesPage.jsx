import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { ArrowRight, Utensils } from 'lucide-react';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.get('/categories');
        setCategories(response.data.data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F8] px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3A233C] tracking-tight">Food Categories</h2>
          <p className="mt-1 text-slate-500">Explore authentic cuisines crafted by passionate local chefs.</p>
        </div>

        {loading ? (
          <p className="text-slate-500 font-medium py-10">Loading categories...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category._id}
                onClick={() => navigate(`/food?category=${encodeURIComponent(category.name)}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  <img
                    src={category.image || 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600'}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#4B254B] transition-colors">{category.name}</h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{category.description || 'Artisanal dishes.'}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#4B254B]">
                    <span>Explore Cuisines</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
