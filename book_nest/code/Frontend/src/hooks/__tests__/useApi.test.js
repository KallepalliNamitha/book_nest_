import { renderHook, act } from '@testing-library/react';
import { useApi } from '../useApi';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBeFalsy();
  });

  test('handles successful GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    axios.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/test');
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBeFalsy();
  });

  test('handles failed GET request', async () => {
    const mockError = { response: { data: { message: 'Error occurred' } } };
    axios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/test');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Error occurred');
    expect(result.current.loading).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith('Error occurred');
  });

  test('handles successful POST request', async () => {
    const mockData = { id: 1, name: 'Test' };
    axios.post.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.post('/test', { name: 'Test' });
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(toast.success).toHaveBeenCalled();
  });

  test('handles failed POST request', async () => {
    const mockError = { response: { data: { message: 'Error occurred' } } };
    axios.post.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.post('/test', { name: 'Test' });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Error occurred');
    expect(result.current.loading).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith('Error occurred');
  });

  test('handles successful PUT request', async () => {
    const mockData = { id: 1, name: 'Updated Test' };
    axios.put.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.put('/test/1', { name: 'Updated Test' });
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(toast.success).toHaveBeenCalled();
  });

  test('handles failed PUT request', async () => {
    const mockError = { response: { data: { message: 'Error occurred' } } };
    axios.put.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.put('/test/1', { name: 'Updated Test' });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Error occurred');
    expect(result.current.loading).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith('Error occurred');
  });

  test('handles successful DELETE request', async () => {
    const mockData = { message: 'Deleted successfully' };
    axios.delete.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.delete('/test/1');
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(toast.success).toHaveBeenCalled();
  });

  test('handles failed DELETE request', async () => {
    const mockError = { response: { data: { message: 'Error occurred' } } };
    axios.delete.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.delete('/test/1');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Error occurred');
    expect(result.current.loading).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith('Error occurred');
  });

  test('sets loading state during request', async () => {
    axios.get.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.get('/test');
    });

    expect(result.current.loading).toBeTruthy();
  });

  test('handles network errors', async () => {
    const networkError = new Error('Network Error');
    axios.get.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/test');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network Error');
    expect(result.current.loading).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith('Network Error');
  });

  test('handles custom error messages', async () => {
    const mockError = { response: { data: { customMessage: 'Custom error' } } };
    axios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/test');
    });

    expect(result.current.error).toBe('Custom error');
    expect(toast.error).toHaveBeenCalledWith('Custom error');
  });
}); 