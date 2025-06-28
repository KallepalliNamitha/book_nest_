import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Unavbar from './Unavbar';
import { Button, Container, Row, Col, Form, Spinner, Pagination } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import RecommendationSection from '../components/RecommendationSection';

const Uitem = () => {
    const [item, setItem] = useState(null);
    const { id } = useParams();
    const { addToCart } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewSort, setReviewSort] = useState('recent');
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewPagination, setReviewPagination] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:5001/item/${id}`)
            .then((resp) => {
                setItem(resp.data);
            })
            .catch((error) => {
                console.log("Failed to fetch item data:", error);
            });
    }, [id]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                const response = await fetch(
                    `http://localhost:5001/api/reviews/${id}?sort=${reviewSort}&page=${reviewPage}&limit=5`
                );
                const data = await response.json();
                setReviews(data.reviews);
                setReviewPagination(data.pagination);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                toast.error('Failed to load reviews');
            } finally {
                setReviewsLoading(false);
            }
        };

        if (id) {
            fetchReviews();
        }
    }, [id, reviewSort, reviewPage]);

    const handleAddToCart = () => {
        addToCart(item);
        toast.success('Added to cart');
    };

    const handleReviewSubmitted = () => {
        setReviewPage(1);
        setReviewSort('recent');
    };

    const handleLikeReview = async (reviewId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to like review');
            }

            setReviews(prevReviews =>
                prevReviews.map(review =>
                    review._id === reviewId
                        ? { ...review, likes: response.data.likes }
                        : review
                )
            );
        } catch (error) {
            console.error('Error liking review:', error);
            toast.error('Failed to like review');
        }
    };

    if (!item) {
        return (
            <div>
                <Unavbar />
                <Container className="text-center py-5">
                    <h2>Loading...</h2>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <Unavbar />
            <Container className="py-5">
                <Row>
                    <Col md={6} className="text-center">
                        <img 
                            src={`http://localhost:5001/${item.itemImage}`} 
                            alt={item.title}
                            style={{ maxHeight: '450px', objectFit: 'contain' }}
                        />
                    </Col>
                    <Col md={6}>
                        <h1 className="mb-4">{item.title}</h1>
                        <div className="mb-4">
                            <h4 className="text-muted">Description</h4>
                            <hr />
                            <p className="lead">{item.description}</p>
                        </div>
                        <div className="mb-4">
                            <h4 className="text-muted">Details</h4>
                            <hr />
                            <p><strong>Author:</strong> {item.author}</p>
                            <p><strong>Genre:</strong> {item.genre}</p>
                            <p><strong>Price:</strong> ₹{item.price}</p>
                            <p><strong>Seller:</strong> {item.userName}</p>
                        </div>
                        <div className="d-grid gap-2">
                            <Button 
                                variant="primary" 
                                size="lg"
                                onClick={handleAddToCart}
                            >
                                Add to Cart
                            </Button>
                            <Link 
                                to={`/orderitem/${item._id}`} 
                                className="btn btn-success btn-lg"
                            >
                                Buy Now
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Container>
            
            <div className="mt-5">
                <h3>Customer Reviews</h3>
                
                {item && (
                    <div className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <h4 className="mb-0 me-3">
                                {item.averageRating?.toFixed(1) || '0.0'} out of 5
                            </h4>
                            <div>
                                <div className="text-muted">
                                    Based on {item.totalReviews || 0} reviews
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <Form.Select
                                value={reviewSort}
                                onChange={(e) => {
                                    setReviewSort(e.target.value);
                                    setReviewPage(1);
                                }}
                                className="w-auto"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="helpful">Most Helpful</option>
                                <option value="rating">Highest Rated</option>
                            </Form.Select>
                        </div>
                    </div>
                )}

                <ReviewForm
                    bookId={id}
                    onReviewSubmitted={handleReviewSubmitted}
                />

                {reviewsLoading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading reviews...</span>
                        </Spinner>
                    </div>
                ) : (
                    <>
                        <ReviewList
                            reviews={reviews}
                            onLikeReview={handleLikeReview}
                        />

                        {reviewPagination && reviewPagination.pages > 1 && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.Prev
                                        onClick={() => setReviewPage(prev => Math.max(1, prev - 1))}
                                        disabled={reviewPage === 1}
                                    />
                                    {[...Array(reviewPagination.pages)].map((_, index) => (
                                        <Pagination.Item
                                            key={index + 1}
                                            active={reviewPage === index + 1}
                                            onClick={() => setReviewPage(index + 1)}
                                        >
                                            {index + 1}
                                        </Pagination.Item>
                                    ))}
                                    <Pagination.Next
                                        onClick={() => setReviewPage(prev => Math.min(reviewPagination.pages, prev + 1))}
                                        disabled={reviewPage === reviewPagination.pages}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Similar books section */}
            {item && (
                <div className="mt-5">
                    <RecommendationSection
                        type="similar"
                        bookId={id}
                        title="Similar Books You Might Like"
                    />
                </div>
            )}
        </div>
    );
};

export default Uitem;
