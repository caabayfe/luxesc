import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/server/script-includes/LuxEscConcierge.js', import.meta.url), 'utf8');

function conciergeWith(records) {
  const queries = [];
  function makeRecord(secure) {
    return function (table) {
      const groups = [];
      let limit = Infinity;
      let order;
      let rows = [];
      let index = -1;
      queries.push({table, secure});
      this.addActiveQuery = () => groups.push([['active', true]]);
      this.addQuery = (field, operator, value) => {
        const group = [[field, value === undefined ? operator : value, value === undefined ? '=' : operator]];
        groups.push(group);
        return {addOrCondition: (orField, orOperator, orValue) => {
          group.push([orField, orValue === undefined ? orOperator : orValue, orValue === undefined ? '=' : orOperator]);
        }};
      };
      this.orderByDesc = field => { order = field; };
      this.setLimit = value => { limit = value; };
      this.query = () => {
        rows = records.filter(row => row.table === table && (!secure || row.readable !== false) && groups.every(group =>
          group.some(([field, value, op]) => op === 'IN' ? String(value).split(',').includes(row[field]) : row[field] === value)
        ));
        if (order) rows.sort((a, b) => b[order] - a[order]);
        rows = rows.slice(0, limit);
      };
      this.next = () => ++index < rows.length;
      this.getUniqueValue = () => rows[index].sys_id;
    };
  }
  const context = {
    Class: {create: () => function () {}},
    GlideRecord: makeRecord(false),
    GlideRecordSecure: makeRecord(true),
    gs: {getUserID: () => 'employee'}
  };
  vm.runInNewContext(source, context);
  const concierge = new context.LuxEscConcierge();
  concierge._myApprovals = () => [];
  concierge._myItem = row => ({sysId: row.getUniqueValue()});
  concierge._request = row => ({sysId: row.getUniqueValue()});
  concierge._runUser = () => 'employee';
  return {concierge, queries};
}

test('My stuff includes the newest readable requests made on the employee’s behalf', () => {
  const records = Array.from({length: 30}, (_, i) => ({
    table: 'sc_req_item', sys_id: `item-${i}`, active: true, opened_by: 'other',
    'request.requested_for': 'employee', sys_updated_on: i
  }));
  records.push(
    {table: 'sc_req_item', sys_id: 'own', active: true, opened_by: 'employee', sys_updated_on: 40},
    {table: 'sc_req_item', sys_id: 'unreadable', active: true, opened_by: 'employee', sys_updated_on: 41, readable: false},
    {table: 'sc_req_item', sys_id: 'closed', active: false, opened_by: 'employee', sys_updated_on: 42},
    {table: 'sc_req_item', sys_id: 'someone-else', active: true, opened_by: 'other', 'request.requested_for': 'other', sys_updated_on: 43},
    {table: 'incident', sys_id: 'caller', active: true, opened_by: 'other', caller_id: 'employee', sys_updated_on: 44},
    {table: 'incident', sys_id: 'foreign', active: true, opened_by: 'other', caller_id: 'other', sys_updated_on: 45}
  );
  const {concierge, queries} = conciergeWith(records);
  const ids = Array.from(concierge.mine().items, item => item.sysId);
  assert.equal(ids.length, 26);
  assert.ok(ids.includes('item-29'));
  assert.ok(!ids.includes('item-0'));
  assert.ok(ids.includes('own'));
  assert.ok(ids.includes('caller'));
  assert.ok(!ids.includes('unreadable'));
  assert.ok(!ids.includes('closed'));
  assert.ok(!ids.includes('someone-else'));
  assert.ok(!ids.includes('foreign'));
  assert.ok(queries.every(query => query.secure));
});

test('the concierge briefing includes recent requests made on the employee’s behalf', () => {
  const records = Array.from({length: 20}, (_, i) => ({
    table: 'sc_req_item', sys_id: `item-${i}`, active: true, opened_by: 'other',
    'request.requested_for': 'employee', sys_updated_on: i
  }));
  const {concierge} = conciergeWith(records);
  const ids = Array.from(concierge.openRequests('run').requests, item => item.sysId);
  assert.equal(ids.length, 10);
  assert.equal(ids[0], 'item-19');
  assert.ok(!ids.includes('item-0'));
});
