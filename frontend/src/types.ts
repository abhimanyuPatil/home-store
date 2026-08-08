export type Unit = 'g' | 'kg' | 'l' | 'pack' | 'bottle';

export type Subsection = {
  id: string;
  locationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Location = {
  id: string;
  name: string;
  subsections: Subsection[];
  createdAt: string;
  updatedAt: string;
};

export type Assignment = {
  assignmentId: string;
  locationId: string;
  locationName?: string;
  subsectionId: string;
  subsectionName?: string;
  quantity: string;
};

export type Supply = {
  id: string;
  name: string;
  unit: Unit;
  primary: Assignment;
  backup: Assignment | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InventoryItem = Pick<Supply, 'id' | 'name' | 'unit'> & {
  primary: Assignment;
};
export type BackupInventoryItem = Pick<Supply, 'id' | 'name' | 'unit'> & {
  backup: Assignment;
};

export type AffectedAssignment = {
  assignmentId: string;
  supplyId: string;
  supplyName: string;
  role: 'primary' | 'backup';
  locationId: string;
  subsectionId: string;
  quantity: string;
};

export const units: Unit[] = ['g', 'kg', 'l', 'pack', 'bottle'];
