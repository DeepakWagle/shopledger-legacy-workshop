'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('invoice GST and total match the order ledger for an HSN-rated item', function () {
  var items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 2 }];
  var ledger = pricing.computeTotals(items, '');
  var figures = invoice.computeInvoiceFigures({ items: items });

  assert.equal(ledger.tax, 10);
  assert.equal(ledger.total, 210);
  assert.equal(figures.tax, ledger.tax);
  assert.equal(figures.total, ledger.total);
  assert.equal(figures.rows[0].gstPercent, 5);
});

test('invoice interprets decimal GST rates the same way as pricing', function () {
  var items = [{ id: 2, name: 'Oil', hsn: '1512', price: 100, qty: 1, gstRate: 0.05 }];
  var ledger = pricing.computeTotals(items, '');
  var figures = invoice.computeInvoiceFigures({ items: items });

  assert.equal(ledger.tax, 5);
  assert.equal(ledger.total, 105);
  assert.equal(figures.tax, ledger.tax);
  assert.equal(figures.total, ledger.total);
  assert.equal(figures.rows[0].gstPercent, 5);
});

test('invoice coupon discount, GST, and total match pricing including the coupon cap', function () {
  var items = [{ id: 3, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 2000, qty: 1 }];
  var ledger = pricing.computeTotals(items, 'SAVE10');
  var figures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(ledger.discount, 150);
  assert.equal(ledger.tax, 92.5);
  assert.equal(ledger.total, 1942.5);
  assert.equal(figures.discount, ledger.discount);
  assert.equal(figures.tax, ledger.tax);
  assert.equal(figures.total, ledger.total);
});

test('rendered invoice shows ledger-matching GST and total without a mismatch notice', function () {
  var order = {
    id: 7,
    date: '2026-11-15',
    status: 'completed',
    items: [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 2 }],
    subtotal: 200,
    tax: 10,
    total: 210
  };
  var html = invoice.render(order);

  assert.ok(html.includes('CGST + SGST (Total GST)</td><td class="r">\u20b910.00'));
  assert.ok(html.includes('Invoice Total</td><td class="r">\u20b9210.00'));
  assert.ok(!html.includes('Accountant Reconciliation Notice'));
});
