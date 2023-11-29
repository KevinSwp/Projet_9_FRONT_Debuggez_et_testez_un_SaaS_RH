import { ROUTES_PATH } from '../constants/routes.js';
import Logout from './Logout.js';

/**
 * check the extension of the file added by user
 * @param {string} filename name + extension of file added by user
 * @returns true if the extension is .jpg, .jpeg, .png else return false
 */
export const checkFileExtension = function (filename) {
  const extensionFile = filename.split('.').pop();
  const allowedExtensions = ['jpeg', 'jpg', 'png'];
  return allowedExtensions.includes(extensionFile.toLowerCase());
};

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.localStorage = localStorage;
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;

    // Logout
    new Logout({ document, localStorage, onNavigate })

    const formNewBill = this.document.querySelector('form[data-testid="form-new-bill"]');
    formNewBill.addEventListener('submit', this.handleSubmit.bind(this));

    const fileInput = this.document.querySelector('input[data-testid="file"]');
    fileInput.addEventListener('change', this.handleChangeFile.bind(this));
  }
  
  // Function upload file
  uploadFile = async (formData, fileName) => {
    try {
      // Attempting to create a bill with the provided formData
      const { fileUrl, key } = await this.store.bills().create({
        data: formData,
        headers: {
          noContentType: true,
        },
      });

      // Setting the file URL, file name, and bill ID to the instance variables after successful upload
      this.fileUrl = fileUrl;
      this.fileName = fileName;
      this.billId = key;

    } catch (error) {
      console.error(error);
    }
  };

  // Function handle file
  handleChangeFile = (e) => {
    e.preventDefault();

    // Variable Declarations
    const errorInput = this.document.querySelector('#extensionError');
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem('user')).email;

    // Append data to formData
    formData.append('file', file);
    formData.append('email', email);

    // Check File Extension
    if (checkFileExtension(file.name)) {
      errorInput.textContent = '';
      this.uploadFile(formData, fileName);
    } else {
      fileInput.value = null;
      errorInput.textContent = 'formats autorisés : .jpeg, .jpg, .png';
    }
  };

  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}