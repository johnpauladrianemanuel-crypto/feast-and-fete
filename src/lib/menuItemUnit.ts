interface MenuItemUnitSource {
  id: string;
  categorySlug: string;
}

export function getMenuItemUnitLabel(item: MenuItemUnitSource): string {
  switch (item.id) {
    case 'item-019':
    case 'item-025':
      return 'container';
    case 'item-020':
    case 'item-028':
      return 'glass';
    default:
      return item.categorySlug === 'drinks' ? 'bottle' : 'tray';
  }
}
