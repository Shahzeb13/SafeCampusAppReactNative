import axios from 'axios';

export const handleApiError = (error: any, showSnackbar: (message: string, type: 'success' | 'error' | 'info') => void) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data?.message || 'Server responded with an error';
      showSnackbar(message, 'error');
      console.log('Axios Response Error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      showSnackbar('No response received from server. Please check your internet connection.', 'error');
      console.log('Axios Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      showSnackbar('Error setting up the request: ' + error.message, 'error');
      console.log('Axios Config Error:', error.message);
    }
  } else {
    // Non-axios error
    showSnackbar('An unexpected error occurred: ' + (error.message || 'Unknown error'), 'error');
    console.log('Non-Axios Error:', error);
  }
};
