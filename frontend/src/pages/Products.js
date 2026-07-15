import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        type: '',
        search: '',
        organic: false
    });
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [filters, page]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/products/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (filters.category) params.append('category', filters.category);
            if (filters.type) params.append('type', filters.type);
            if (filters.search) params.append('search', filters.search);
            if (filters.organic) params.append('organic', 'true');

            const response = await api.get(`/products?${params}`);
            setProducts(response.data.products);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Fetch products error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStockBadge = (quantity) => {
        if (quantity === 0) return <span className="badge badge-danger">Out of Stock</span>;
        if (quantity < 100) return <span className="badge badge-warning">Low Stock</span>;
        return <span className="badge badge-success">In Stock</span>;
    };

    if (loading) return <div className="loading">Loading products...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Products - Surya Fresh Mart</h1>
            </div>

            <div className="card">
                <div className="filters">
                    <div className="filter-group">
                        <label>Category:</label>
                        <select
                            value={filters.category}
                            onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
                        >
                            <option value="">All Categories</option>
                            <option value="fruits">Fruits</option>
                            <option value="vegetables">Vegetables</option>
                            <option value="dry_fruits">Dry Fruits</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Type:</label>
                        <select
                            value={filters.type}
                            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
                        >
                            <option value="">All Types</option>
                            <option value="indian">Indian</option>
                            <option value="international">International</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Search:</label>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={filters.search}
                            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                        />
                    </div>
                    <div className="filter-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.organic}
                                onChange={(e) => { setFilters({ ...filters, organic: e.target.checked }); setPage(1); }}
                            />
                            Organic Only
                        </label>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {products.map((product) => (
                        <div key={product.id} className="card" style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span className="badge badge-info">{product.category_type}</span>
                                {product.is_organic && <span className="badge badge-success">Organic</span>}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                {product.description}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                                <div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6366f1' }}>
                                        ₹{product.price}
                                    </span>
                                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>/{product.unit}</span>
                                </div>
                                {getStockBadge(product.stock_quantity)}
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                                Origin: {product.origin_country}
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No products found matching your criteria.
                    </div>
                )}

                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '0.5rem 1rem' }}>
                        Page {page} of {pagination.pages || 1}
                    </span>
                    <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Products;
