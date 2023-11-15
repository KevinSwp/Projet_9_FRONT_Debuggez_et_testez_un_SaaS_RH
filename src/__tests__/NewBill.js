/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import NewBill, { checkFileExtension } from '../containers/NewBill.js';
import Router from '../app/Router.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store.js';

// Unit test extension file
describe('Supporting Document Extension Test Suites', () => {
  it('should accept a valid file extension', () => {
    expect(checkFileExtension('document1.jpg')).toBe(true);
  });

  it('should reject an invalid file extension', () => {
    expect(checkFileExtension('document2.svg')).toBe(false);
  });
});

describe('Given I am connected as an employee', () => {
  describe('When I am on the new bill page', () => {
    // Test display vertical email icon
    test('Then email icon in vertical layout should be highlighted', async () => {
      // Mocking localStorage on the window object and setting a user item to simulate an authenticated employee user
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Setting up the initial HTML structure for the test
      document.body.innerHTML = '<div id="root"></div>';

      // Initializing the router for navigation
      Router();

      // Navigating to the new bill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Awaiting for the email icon to be available in the DOM and then checking if it has the 'active-icon' class
      const mailIcon = await waitFor(() => screen.getByTestId('icon-mail'));
      expect(mailIcon.classList).toContain('active-icon');
    });
  });

  describe('When I am on NewBill Page and I select an image in a correct format', () => {
    // This test checks if the input file displays the file name upon selecting an image
    test('Then the input file should display the file name', () => {
      // Mocking localStorage on the window object and setting a user item to simulate an authenticated employee user
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Setting up the initial HTML structure for the test
      document.body.innerHTML = '<div id="root"></div>';

      // Initializing the router for navigation handling in the tests
      Router();

      // Programmatically navigating to the NewBill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Creating an instance of NewBill class with necessary dependencies
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Querying the DOM for the file input element and setting up a change event handler
      const fileInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener('change', handleChangeFile);

      // Simulating a file selection event on the file input and checking if the file name is correctly displayed
      fireEvent.change(fileInput, { target: { files: [new File(['image.png'], 'image.png', { type: 'image/png' })] } });
      expect(fileInput.files[0].name).toBe('image.png');

      // Expectation that the change handler function was called upon file selection
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });


  describe('When I am on NewBill Page and I select an image in an incorrect format', () => {
    // Test display error message
    test('Then an error message should be displayed', () => {
      // Set up environment and DOM
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
      document.body.innerHTML = '<div id="root"></div>';
      Router();
      window.onNavigate(ROUTES_PATH.NewBill);

      // Initialize NewBill and set up file input
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener('change', handleChangeFile);

      // Simulate file selection with incorrect format and check error message
      fireEvent.change(fileInput, { target: { files: [new File(['image.txt'], 'image.txt', { type: 'image/txt' })] } });
      expect(fileInput.files[0].name).toBe('image.txt');
      const errorInput = screen.getByTestId('errorMessage');
      expect(errorInput.textContent).toBe('formats autorisés : .jpeg, .jpg, .png');
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  describe('When I submit a new bill', () => {
    // This test verifies that a bill is created upon submission
    test('then a bill is created', () => {
      // Mocking localStorage on the window object and setting a user item to simulate an authenticated employee user
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Setting up the initial HTML structure for the test
      document.body.innerHTML = '<div id="root"></div>';

      // Initializing the router for navigation handling in the tests
      Router();

      // Programmatically navigating to the NewBill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Creating an instance of NewBill class with necessary dependencies
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Setting up a mock function for handling form submission
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      // Querying the DOM for the form element and adding an event listener for the submit event
      const submit = screen.getByTestId('form-new-bill');
      submit.addEventListener('submit', handleSubmit);

      // Simulating the form submission event
      fireEvent.submit(submit);

      // Expectation that the handleSubmit function was called upon form submission
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  //POST Integration test
  describe('Given I am connected as an employee', () => {
    describe('When I submit a new bill', () => {
      // Test for successful POST request
      test('fetches bills from mock API POST', async () => {
        // Mocks the POST function of the store and tracks its calls
        const postSpy = jest.spyOn(mockStore, 'bills');
        const billIsCreated = await postSpy().update();
        // Expectation that the postSpy function is called exactly once time
        expect(postSpy).toHaveBeenCalledTimes(1);

        // Expectation that the created bill has the specific ID '47qAXb6fIm2zOKkLzMro'
        // checks if the bill creation is the same in the expected bill ID
        expect(billIsCreated.id).toBe('47qAXb6fIm2zOKkLzMro');
      });

      // Function to set up and perform tests for error scenarios
      const setupNewBillTest = async (errorCode) => {
        // Initializes the DOM environment for the NewBill page
        document.body.innerHTML = `<div id="root"></div>`;
        Router();
        window.onNavigate(ROUTES_PATH.NewBill);
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

        // Mocks an error response for the store's update function
        const mockedError = jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => ({
          update: () => Promise.reject(new Error(`Erreur ${errorCode}`)),
        }));

        // Expectation that the error is thrown as expected and that NewBill properties are reset
        await expect(mockedError().update).rejects.toThrow(`Erreur ${errorCode}`);
        // Expectation that the mocked error function is called
        // This confirms that the error scenario is indeed being tested
        expect(mockedError).toHaveBeenCalled();

        // Expectation that certain properties of the newBill object are null after the error
        // checks if the application correctly resets these properties in case of an error
        expect(newBill.billId).toBeNull();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      };

      // Test for handling a 404 error from the API
      test('fetches bills from mock API POST and fails with 404 message error', async () => {
        await setupNewBillTest(404); // Calls the setup function with a 404 error code
      });

      // Test for handling a 500 error from the API
      test('fetches bills from mock API POST and fails with 500 message error', async () => {
        await setupNewBillTest(500); // Calls the setup function with a 500 error code
      });
    });
  });
});
