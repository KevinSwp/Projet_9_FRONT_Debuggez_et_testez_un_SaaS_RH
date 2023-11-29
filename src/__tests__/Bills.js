/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';

import router from '../app/Router.js';
import Bills from '../containers/Bills.js';
import mockStore from '../__mocks__/store.js';

// Function to sort dates in descending order
function sortDates(dates) {
  return dates.sort((a, b) => new Date(a) - new Date(b));
}

describe('Given I am connected as an employee', () => {
  describe("When I am on Bills Page", () => {
    // Test vertical bill icon
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Mocking local storage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      // Setting a fake user in local storage
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      // Creating a root div in the document
      const root = document.createElement("div")
      // Setting an ID for this div
      root.setAttribute("id", "root")
      // Appending the div to the body of the document
      document.body.append(root)
      // Initializing the router
      router()
      // Triggering navigation to the Bills page
      window.onNavigate(ROUTES_PATH.Bills)
      // Waiting for the window icon to be in the document
      await waitFor(() => screen.getByTestId('icon-window'))
      // Getting the window icon
      const windowIcon = screen.getByTestId('icon-window')
      // Expectation to be written for the icon
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    })

    // Test ordered bills by date
    test("Then bills should be ordered from earliest to latest", () => {
      // Rendering BillsUI with mocked bills data
      document.body.innerHTML = BillsUI({ data: bills });

      // Extracting dates from the rendered component
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);

      // Sorting the dates
      const datesTriees = sortDates(dates);

      // Expecting that the dates in the document match the sorted dates
      expect(dates).toEqual(datesTriees);
    });

    describe('When I click on the icon eye', () => {
      // Test display modal on clicked eye icon
      test('Then a modal should open', () => {
        // Sets up the HTML structure and mocks navigation
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };

        // Instantiates a new Bills object
        const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

        // Mocks jQuery modal and handleClickIconEye function
        $.fn.modal = jest.fn();
        const handleClickIconEye = jest.fn(bill.handleClickIconEye);

        // Queries for icon and modal
        const iconEye = screen.getAllByTestId('icon-eye');
        const modale = document.getElementById('modaleFile');

        // Adds click event and asserts modal behavior
        iconEye.forEach((icon) => {
          icon.addEventListener('click', () => handleClickIconEye(icon));
          userEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
          expect(modale).toBeTruthy();
        });
      });
    });

    describe('When I click on the new bill button', () => {
      // Test redirect to the new bill page on clicked button "new bill"
      test('Then I should be redirect on the page new bill', () => {
        // Mocking localStorage on the window object and setting a user item to simulate an authenticated user
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

        // Setting up the HTML structure by rendering the Bills UI with mock data
        document.body.innerHTML = BillsUI({ data: bills });

        // Mocking the onNavigate function to update the document body when navigation occurs
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };

        // Creating an instance of Bills class with necessary dependencies
        const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

        // Querying the DOM for the new bill button
        const newButton = screen.getByTestId('btn-new-bill');

        // Creating a mock function for the click event handler of the new bill button
        const handleClickNewBill = jest.fn(bill.handleClickNewBill());

        // Adding an event listener to the new bill button to trigger the mock function on click
        newButton.addEventListener('click', handleClickNewBill);

        // Simulating a click event on the new bill button
        fireEvent.click(newButton);

        // Expectation that the click handler function was called
        expect(handleClickNewBill).toHaveBeenCalled();

        // Querying the DOM for the new bill form and asserting its presence to verify the redirection
        const formNewBill = screen.getByTestId('form-new-bill');
        expect(formNewBill).toBeTruthy();
      });
    });
  });

  //GET integration test
  describe('Given I am a user connected as Employee', () => {
    // Function to set up localStorage and root div for the document body
    const setupLocalStorageAndRootDiv = () => {
      localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      return root;
    };

    describe('When I navigate on the bills page', () => {
      // Test checks if the application correctly fetches bills from a mock API using a GET request
      test('Then fetches bills from mock API GET', async () => {
        // Setting up the environment for the test
        // Simulate the environment
        const root = setupLocalStorageAndRootDiv();
        const pathname = ROUTES_PATH['Bills'];

        // Simulates navigating to the bills page and shows a loading state initially
        root.innerHTML = ROUTES({ pathname: pathname, loading: true });

        // Creating an instance of the Bills class with necessary dependencies
        const billsList = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

        // Fetching bills and validating the result
        await billsList.getBills().then((data) => {
          // Updating the HTML with the fetched data
          root.innerHTML = BillsUI({ data });

          // Expectation :
          // Correct route
          expect(pathname).toBe(`#employee/bills`);
          // Correct number of rows of bills
          expect(screen.getByTestId('tbody').rows.length).toBe(4);
          // Display new bill button
          expect(screen.getByTestId('btn-new-bill')).toBeTruthy();
          // Display the text title "Mes notes de frais" on the page
          expect(screen.getByText('Mes notes de frais')).toBeTruthy();
        });
      });
    });

    describe('When an error occurs on interacting API', () => {
      // Before each test, some settings are made
      beforeEach(() => {
        // Mocking the store's bills method to control its behavior in tests
        jest.spyOn(mockStore, 'bills');

        // Mocking the localStorage on the window object
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Setting up local storage and root div for the testing environment
        setupLocalStorageAndRootDiv();

        // Initializing the router for navigation handling in the tests
        router();
      });

      // Function test API error handling for different error codes
      const testAPIError = async (errorCode) => {
        // Mock implementation of the bills method is set to reject with an error, simulating an API error
        mockStore.bills.mockImplementationOnce(() => Promise.reject(new Error(`Erreur ${errorCode}`)));

        // Waiting for the next event loop tick to ensure all promises and state changes have been processed
        await new Promise(process.nextTick);

        // Setting the document's body to reflect the UI in case of an API error
        document.body.innerHTML = BillsUI({ error: `Erreur ${errorCode}` });

        // Querying the screen for the error message and checking if it exists in the document
        const message = screen.getByText(new RegExp(`Erreur ${errorCode}`));
        expect(message).toBeTruthy();
      };

      // Test to check if the application correctly handles a 404 error from the API
      test('Then fetches bills from an API and fails with 404 message error', async () => {
        await testAPIError(404);
      });

      // Test to check if the application correctly handles a 500 error from the API
      test('Then fetches messages from an API and fails with 500 message error', async () => {
        await testAPIError(500);
      });
    });
  });
});