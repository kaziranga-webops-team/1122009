/**
 * Checks the permission table and the content schemas.
 *
 *   npm run check:permissions
 *
 * These are the rules the content API enforces on every request, so a change
 * that quietly widens access shows up here rather than in production. It needs
 * no network, no credentials and no signed-in user — it exercises the same
 * functions the route handlers call.
 */
import { can, writableResources, canManageRoles, canUsePortalAdmin } from '../lib/portal/permissions';
import { restrictFields, schemaFor } from '../lib/portal/contentSchema';
import type { UserRole } from '../types/portal';

let pass = 0;
let fail = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? '  pass' : '  FAIL'}  ${name}${ok ? '' : `\n          expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`);
  ok ? pass++ : fail++;
}

const OWN = { rowId: 'row-1', ownRowId: 'row-1' };
const OTHER = { rowId: 'row-2', ownRowId: 'row-1' };

console.log('\nReads are open to every signed-in role');
for (const role of ['USER', 'RC', 'ADMIN', 'SUPER_ADMIN'] as UserRole[]) {
  check(`${role} may read events`, can(role, 'events', 'read'), true);
}
check('a signed-out caller may not read', can(undefined, 'events', 'read'), false);

console.log('\nAdmins may write everything');
for (const role of ['ADMIN', 'SUPER_ADMIN'] as UserRole[]) {
  check(`${role} creates events`, can(role, 'events', 'create'), true);
  check(`${role} deletes gallery`, can(role, 'gallery_items', 'delete'), true);
  check(`${role} edits any council row`, can(role, 'council_members', 'update', OTHER), true);
}

console.log('\nRC: events yes, own council row yes, nothing else');
check('RC creates events', can('RC', 'events', 'create'), true);
check('RC deletes events', can('RC', 'events', 'delete'), true);
check('RC edits own council row', can('RC', 'council_members', 'update', OWN), true);
check('RC cannot edit another row', can('RC', 'council_members', 'update', OTHER), false);
check('RC cannot edit an unlinked row', can('RC', 'council_members', 'update', { rowId: 'x', ownRowId: null }), false);
check('RC cannot create council rows', can('RC', 'council_members', 'create', OWN), false);
check('RC cannot delete council rows', can('RC', 'council_members', 'delete', OWN), false);
check('RC cannot touch the gallery', can('RC', 'gallery_items', 'update'), false);
check('RC cannot touch meetups', can('RC', 'meetups', 'create'), false);
check('RC cannot touch study links', can('RC', 'study_links', 'update'), false);

console.log('\nMembers write nothing');
for (const r of ['events', 'council_members', 'gallery_items', 'meetups'] as const) {
  check(`USER cannot create ${r}`, can('USER', r, 'create'), false);
  check(`USER cannot delete ${r}`, can('USER', r, 'delete'), false);
}

console.log('\nWhich sections each role is offered');
check('USER sees none', writableResources('USER'), []);
check('RC sees events + council', writableResources('RC'), ['events', 'council_members']);
check('ADMIN sees all seven', writableResources('ADMIN').length, 7);

console.log('\nRole-gated areas');
check('only SUPER_ADMIN manages roles', ['USER', 'RC', 'ADMIN', 'SUPER_ADMIN'].map((r) => canManageRoles(r as UserRole)), [false, false, false, true]);
check('RC and up reach the admin suite', ['USER', 'RC', 'ADMIN', 'SUPER_ADMIN'].map((r) => canUsePortalAdmin(r as UserRole)), [false, true, true, true]);

console.log('\nAn RC editing their own row is narrowed to contact fields');
{
  const payload = { name: 'New Name', role: 'President', council_type: 'Upper', tagline: 'hi', phone: '1', email: 'a@b.co', image_url: '', color: '#fff' };
  const { data, rejected } = restrictFields('RC', 'council_members', payload);
  check('keeps only their own details', Object.keys(data).sort(), ['color', 'email', 'image_url', 'phone', 'tagline']);
  check('rejects identity fields', rejected.sort(), ['council_type', 'name', 'role']);
}
{
  const payload = { name: 'New Name', tagline: 'hi' };
  const { data, rejected } = restrictFields('ADMIN', 'council_members', payload);
  check('admins are not narrowed', Object.keys(data).sort(), ['name', 'tagline']);
  check('nothing rejected for admins', rejected, []);
}

console.log('\nSchemas reject bad input');
check('empty event title', schemaFor('events').safeParse({ title: '' }).success, false);
check('unknown status', schemaFor('events').safeParse({ title: 'x', status: 'nope' }).success, false);
check('non-http image url', schemaFor('events').safeParse({ title: 'x', image_url: 'javascript:alert(1)' }).success, false);
check('valid event', schemaFor('events').safeParse({ title: 'Quiz night', status: 'upcoming' }).success, true);
check('bad council email', schemaFor('council_members').safeParse({ name: 'A', email: 'not-an-email' }).success, false);
check('blank council email is fine', schemaFor('council_members').safeParse({ name: 'A', email: '' }).success, true);
check('id cannot be injected', Object.keys(schemaFor('events').parse({ title: 'x', id: 'hack' })).includes('id'), false);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
