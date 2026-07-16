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

    const getStockBadge = (quantity) => {
        if (quantity === 0) return { label: 'Out of Stock', color: '#ef4444', bg: '#fef2f2' };
        if (quantity < 100) return { label: 'Low Stock', color: '#f59e0b', bg: '#fffbeb' };
        return { label: 'In Stock', color: '#10b981', bg: '#ecfdf5' };
    };

    const getCategoryBadge = (category) => {
        const map = {
            fruits: { label: 'Fruits', color: '#8b5cf6', bg: '#f5f3ff' },
            vegetables: { label: 'Vegetables', color: '#059669', bg: '#ecfdf5' },
            dry_fruits: { label: 'Dry Fruits', color: '#d97706', bg: '#fffbeb' }
        };
        return map[category] || { label: category, color: '#6b7280', bg: '#f9fafb' };
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

    const styles = {
        pageContainer: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
            padding: '0',
        },
        header: {
            background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #047857 100%)',
            padding: '2.5rem 2rem',
            color: 'white',
            textAlign: 'center',
        },
        headerTitle: {
            fontSize: '2rem',
            fontWeight: '800',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em',
        },
        headerSubtitle: {
            fontSize: '1rem',
            opacity: 0.9,
            margin: 0,
        },
        controlsBar: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.5rem 2rem',
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
        filtersRow: {
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            flex: 1,
        },
        filterSelect: {
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1.5px solid #d1d5db',
            fontSize: '0.875rem',
            background: 'white',
            color: '#374151',
            cursor: 'pointer',
            minWidth: '140px',
            outline: 'none',
            transition: 'border-color 0.2s',
        },
        searchInput: {
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1.5px solid #d1d5db',
            fontSize: '0.875rem',
            width: '220px',
            outline: 'none',
            transition: 'border-color 0.2s',
        },
        organicToggle: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1.5px solid #d1d5db',
            fontSize: '0.875rem',
            color: '#374151',
            background: 'white',
            userSelect: 'none',
            transition: 'all 0.2s',
        },
        organicToggleActive: {
            border: '1.5px solid #16a34a',
            background: '#ecfdf5',
            color: '#16a34a',
        },
        exportBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #16a34a, #059669)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            whiteSpace: 'nowrap',
        },
        resultsInfo: {
            padding: '1rem 2rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            borderBottom: '1px solid #f3f4f6',
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            padding: '1.5rem 2rem',
        },
        productCard: {
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
        },
        cardImageContainer: {
            width: '100%',
            height: '200px',
            overflow: 'hidden',
            position: 'relative',
        },
        cardImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
        },
        cardBadges: {
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            gap: '6px',
            zIndex: 2,
        },
        badge: {
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '700',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
        },
        organicBadge: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            color: 'white',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
        },
        cardBody: {
            padding: '1.25rem',
        },
        cardTitle: {
            fontSize: '1.05rem',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.3,
        },
        priceRow: {
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
            marginBottom: '0.75rem',
        },
        price: {
            fontSize: '1.35rem',
            fontWeight: '800',
            color: '#16a34a',
        },
        unit: {
            fontSize: '0.85rem',
            color: '#9ca3af',
            fontWeight: '500',
        },
        metaRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f3f4f6',
        },
        origin: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.78rem',
            color: '#6b7280',
        },
        stockBadge: {
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: '700',
        },
        emptyState: {
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#9ca3af',
        },
        emptyIcon: {
            fontSize: '3rem',
            marginBottom: '1rem',
        },
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '2rem',
            borderTop: '1px solid #f3f4f6',
        },
        pageBtn: {
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1.5px solid #d1d5db',
            background: 'white',
            color: '#374151',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        pageBtnActive: {
            background: 'linear-gradient(135deg, #16a34a, #059669)',
            color: 'white',
            border: '1.5px solid #16a34a',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
        },
        pageBtnDisabled: {
            opacity: 0.4,
            cursor: 'not-allowed',
        },
        loader: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            flexDirection: 'column',
            gap: '1rem',
            color: '#6b7280',
        },
        spinner: {
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #16a34a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        },
    };

    if (loading) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.loader}>
                    <div style={styles.spinner}></div>
                    <span>Loading products...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <div style={styles.header}>
                <h1 style={styles.headerTitle}>{t('products') || 'Products'}</h1>
                <p style={styles.headerSubtitle}>Fresh produce delivered to your doorstep</p>
            </div>

            <div style={styles.controlsBar}>
                <div style={styles.filtersRow}>
                    <select
                        style={styles.filterSelect}
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="fruits">Fruits</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="dry_fruits">Dry Fruits</option>
                    </select>

                    <select
                        style={styles.filterSelect}
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
                        style={styles.searchInput}
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />

                    <div
                        style={{
                            ...styles.organicToggle,
                            ...(filters.organic ? styles.organicToggleActive : {}),
                        }}
                        onClick={() => handleFilterChange('organic', !filters.organic)}
                    >
                        <span style={{ fontSize: '1rem' }}>{filters.organic ? '🌿' : '🌱'}</span>
                        Organic
                    </div>
                </div>

                <button
                    style={styles.exportBtn}
                    onClick={exportToExcel}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(22,163,74,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(22,163,74,0.3)';
                    }}
                >
                    📊 Export to Excel
                </button>
            </div>

            <div style={styles.resultsInfo}>
                Showing {paginatedProducts.length} of {filteredProducts.length} products
                {filters.category && ` in ${filters.category}`}
                {filters.organic && ' (Organic only)'}
            </div>

            {paginatedProducts.length > 0 ? (
                <div style={styles.gridContainer}>
                    {paginatedProducts.map((product) => {
                        const stock = getStockBadge(product.stock_quantity);
                        const categoryBadge = getCategoryBadge(product.category_type);
                        const imageUrl = product.image_url || getProductImage(product.name, product.category_type);

                        return (
                            <div
                                key={product.id}
                                style={styles.productCard}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 12px 24px rgba(0,0,0,0.1)';
                                    const img = e.currentTarget.querySelector('img');
                                    if (img) img.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow =
                                        '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
                                    const img = e.currentTarget.querySelector('img');
                                    if (img) img.style.transform = 'scale(1)';
                                }}
                            >
                                <div style={styles.cardImageContainer}>
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        style={styles.cardImage}
                                        loading="lazy"
                                    />
                                    <div style={styles.cardBadges}>
                                        <span
                                            style={{
                                                ...styles.badge,
                                                color: categoryBadge.color,
                                                background: categoryBadge.bg,
                                            }}
                                        >
                                            {categoryBadge.label}
                                        </span>
                                    </div>
                                    {product.is_organic && (
                                        <div style={styles.organicBadge}>🌿 Organic</div>
                                    )}
                                </div>

                                <div style={styles.cardBody}>
                                    <h3 style={styles.cardTitle}>{product.name}</h3>
                                    <div style={styles.priceRow}>
                                        <span style={styles.price}>₹{product.price}</span>
                                        <span style={styles.unit}>/{product.unit}</span>
                                    </div>
                                    <div style={styles.metaRow}>
                                        <span style={styles.origin}>
                                            🌍 {product.origin_country || 'India'}
                                        </span>
                                        <span
                                            style={{
                                                ...styles.stockBadge,
                                                color: stock.color,
                                                background: stock.bg,
                                            }}
                                        >
                                            {stock.label}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addItem(product, 1);
                                            navigate('/cart');
                                        }}
                                        style={{
                                            width: '100%',
                                            marginTop: '0.75rem',
                                            padding: '10px',
                                            background: 'linear-gradient(135deg, #16a34a, #059669)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 8px rgba(22,163,74,0.2)',
                                            fontFamily: 'Inter, sans-serif'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(22,163,74,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(22,163,74,0.2)';
                                        }}
                                    >
                                        🛒 Order Now
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🔍</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                        No products found
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Try adjusting your filters or search terms
                    </p>
                </div>
            )}

            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        style={{
                            ...styles.pageBtn,
                            ...(page === 1 ? styles.pageBtnDisabled : {}),
                        }}
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
                                    style={{
                                        padding: '0.5rem 0.35rem',
                                        color: '#9ca3af',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    style={{
                                        ...styles.pageBtn,
                                        ...(p === page ? styles.pageBtnActive : {}),
                                    }}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    <button
                        style={{
                            ...styles.pageBtn,
                            ...(page >= totalPages ? styles.pageBtnDisabled : {}),
                        }}
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    .filters-row {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default Products;
