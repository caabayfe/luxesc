/**
 * Marks every catalog variable in a record payload as read-only.
 *
 * The variable editor honours write access, so a requester who may write the
 * requested item would otherwise get editable answers. Submitted answers are a
 * record of what was asked for, so the portal always shows them read-only.
 */
function lock(variable) {
  variable.readOnly = true;
  (variable.fields || []).forEach(lock);
}

export function lockVariables(record) {
  const layout =
    record?.data?.GlideViewQuery_Query?.uiView?.glideLayoutItem?._query
      ?.GlideLayout_Query?.formLayout;
  (layout?.elementsData || []).forEach(element =>
    (element?.variables || []).forEach(lock)
  );
  return record;
}
