import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import * as XLSX from 'xlsx';

const getProductImage = (name, category) => {
    const lower = name?.toLowerCase() || '';
    if (lower.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300';
    if (lower.includes('banana')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300';
    if (lower.includes('orange')) return 'https://images.unsplash.com/photo-1547514701-42782101795e?w=300';
    if (lower.includes('mango')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300';
    if (lower.includes('grape')) return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300';
    if (lower.includes('tomato')) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
    if (lower.includes('potato')) return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300';
    if (lower.includes('onion')) return 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=300';
    if (category === 'fruits') return 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=300';
    if (category === 'vegetables') return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300';
    if (category === 'dry_fruits') return 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=300';
    return 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=300';
};

const PRODUCTS_PER_PAGE = 12;

const Products = () => {
    const { t } = useLanguage();
    const { addItem, getItemCount } = useCart();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        type: '',
        search: '',
        organic: false
    });
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Fetch products error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((product) => {
        if (filters.category && product.category_type !== filters.category) return false;
        if (filters.type && product.parent_category?.toLowerCase() !== filters.type) return false;
        if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.organic && !product.is_organic) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (page - 1) * PRODUCTS_PER_PAGE,
        page * PRODUCTS_PER_PAGE
    );

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const getStockBadgeClass = (quantity) => {
        if (quantity === 0) return 'badge-danger';
        if (quantity < 100) return 'badge-warning';
        return 'badge-success';
    };

    const getStockLabel = (quantity) => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity < 100) return 'Low Stock';
        return 'In Stock';
    };

    const getCategoryBadgeClass = (category) => {
        const map = {
            fruits: 'badge-info',
            vegetables: 'badge-success',
            dry_fruits: 'badge-warning'
        };
        return map[category] || 'badge';
    };

    const getCategoryLabel = (category) => {
        const map = {
            fruits: 'Fruits',
            vegetables: 'Vegetables',
            dry_fruits: 'Dry Fruits'
        };
        return map[category] || category;
    };

    const exportToExcel = () => {
        const data = filteredProducts.map((p) => ({
            Name: p.name,
            Category: p.category_type,
            Type: p.parent_category,
            Price: p.price,
            Unit: p.unit,
            Stock: p.stock_quantity,
            Origin: p.origin_country,
            Organic: p.is_organic ? 'Yes' : 'No'
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
        XLSX.writeFile(workbook, 'products_export.xlsx');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-sky-50">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-gray-500">
                    <div className="loading-spinner"></div>
                    <span>Loading products...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-sky-50 font-body">
            <div className="bg-gradient-to-r from-brand-500 to-forest-500 py-10 px-8 text-center text-white">
                <h1 className="font-display text-3xl font-extrabold mb-2 tracking-tight">
                    {t('products') || 'Products'}
                </h1>
                <p className="text-base opacity-90 m-0">
                    Fresh produce delivered to your doorstep
                </p>
            </div>

            <div className="card flex flex-col md:flex-row justify-between items-center flex-wrap gap-4 px-4 md:px-8 py-5">
                <div className="flex gap-3 flex-wrap items-center flex-1">
                    <select
                        className="input-field min-w-[140px]"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="fruits">Fruits</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="dry_fruits">Dry Fruits</option>
                    </select>

                    <select
                        className="input-field min-w-[140px]"
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="indian">Indian</option>
                        <option value="international">International</option>
                        <option value="exotic">Exotic</option>
                    </select>

                    <input
                        type="text"
                        className="input-field w-full md:w-[220px]"
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />

                    <button
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-all border select-none ${
                            filters.organic
                                ? 'border-brand-500 bg-brand-50 text-brand-600'
                                : 'border-gray-300 bg-white text-gray-600 hover:border-brand-300'
                        }`}
                        onClick={() => handleFilterChange('organic', !filters.organic)}
                    >
                        <span className="text-base">{filters.organic ? '🌿' : '🌱'}</span>
                        Organic
                    </button>
                </div>

                <button
                    className="btn-brand flex items-center gap-2 whitespace-nowrap"
                    onClick={exportToExcel}
                >
                    📊 Export to Excel
                </button>
            </div>

            <div className="px-4 md:px-8 py-4 text-sm text-gray-500 border-b border-gray-100">
                Showing {paginatedProducts.length} of {filteredProducts.length} products
                {filters.category && ` in ${filters.category}`}
                {filters.organic && ' (Organic only)'}
            </div>

            {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-8">
                    {paginatedProducts.map((product) => {
                        const imageUrl = product.image_url || getProductImage(product.name, product.category_type);

                        return (
                            <div
                                key={product.id}
                                className="card card-hover group cursor-pointer relative overflow-hidden"
                            >
                                <div className="w-full h-48 overflow-hidden relative">
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                                        <span className={`badge ${getCategoryBadgeClass(product.category_type)}`}>
                                            {getCategoryLabel(product.category_type)}
                                        </span>
                                    </div>
                                    {product.is_organic && (
                                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[0.7rem] font-bold tracking-wide uppercase bg-gradient-to-r from-brand-500 to-green-400 text-white shadow-lg">
                                            🌿 Organic
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <span className="text-xl font-extrabold text-brand-600">₹{product.price}</span>
                                        <span className="text-sm text-gray-400 font-medium">/{product.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            🌍 {product.origin_country || 'India'}
                                        </span>
                                        <span className={`badge ${getStockBadgeClass(product.stock_quantity)}`}>
                                            {getStockLabel(product.stock_quantity)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addItem(product, 1);
                                            navigate('/cart');
                                        }}
                                        className="btn-brand w-full mt-3 text-[13px]"
                                    >
                                        🛒 Order Now
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 px-8 text-gray-400">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="m-0 mb-2 text-gray-600">No products found</h3>
                    <p className="m-0 text-sm">Try adjusting your filters or search terms</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-8 border-t border-gray-100">
                    <button
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            page === 1
                                ? 'border-gray-300 bg-white text-gray-600 opacity-40 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 cursor-pointer'
                        }`}
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        ← Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                            (p) =>
                                p === 1 ||
                                p === totalPages ||
                                (p >= page - 1 && p <= page + 1)
                        )
                        .reduce((acc, p, idx, arr) => {
                            if (idx > 0 && p - arr[idx - 1] > 1) {
                                acc.push('...');
                            }
                            acc.push(p);
                            return acc;
                        }, [])
                        .map((p, idx) =>
                            p === '...' ? (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="px-1 py-2 text-gray-400 text-sm"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                                        p === page
                                            ? 'bg-gradient-to-r from-brand-500 to-forest-500 text-white border-brand-500 shadow-lg'
                                            : 'border-gray-300 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600'
                                    }`}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    <button
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            page >= totalPages
                                ? 'border-gray-300 bg-white text-gray-600 opacity-40 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 cursor-pointer'
                        }`}
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default Products;
