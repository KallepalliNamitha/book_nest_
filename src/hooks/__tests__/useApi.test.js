import { renderHook, act } from '@testing-library/react';
import useApi from '../useApi';
import toast from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useApi(() => {}));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  test('handles successful API call', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = jest.fn().mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  test('handles API error', async () => {
    const mockError = { response: { data: { message: 'API Error' } } };
    const mockApiFunction = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Error is expected
      }
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBe('API Error');
    expect(toast.error).toHaveBeenCalledWith('API Error');
  });

  test('shows success toast when enabled', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = jest.fn().mockResolvedValue({ data: mockData });

    const { result } = renderHook(() =>
      useApi(mockApiFunction, {
        showSuccessToast: true,
        successMessage: 'Success!'
      })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(toast.success).toHaveBeenCalledWith('Success!');
  });

  test('does not show error toast when disabled', async () => {
    const mockError = { response: { data: { message: 'API Error' } } };
    const mockApiFunction = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useApi(mockApiFunction, { showErrorToast: false })
    );

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Error is expected
      }
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  test('transforms response data', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = jest.fn().mockResolvedValue({ data: mockData });
    const transformResponse = (data) => ({ ...data, transformed: true });

    const { result } = renderHook(() =>
      useApi(mockApiFunction, { transformResponse })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ ...mockData, transformed: true });
  });

  test('passes arguments to API function', async () => {
    const mockApiFunction = jest.fn().mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useApi(mockApiFunction));

    const arg1 = 'test';
    const arg2 = { id: 1 };

    await act(async () => {
      await result.current.execute(arg1, arg2);
    });

    expect(mockApiFunction).toHaveBeenCalledWith(arg1, arg2);
  });

  test('resets state correctly', () => {
    const { result } = renderHook(() => useApi(() => {}));

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  test('handles error without response data', async () => {
    const mockError = new Error('Network error');
    const mockApiFunction = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Error is expected
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(toast.error).toHaveBeenCalledWith('Network error');
  });
}); 