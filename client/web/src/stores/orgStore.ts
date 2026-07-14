import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Department {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: Department[];
}

export interface Employee {
  key: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  department: string;
  departmentId: string;
  role: string;
  roleCode: string;
  status: 'active' | 'disabled' | 'resigned';
  position: string;
  joinDate?: string;
  resignDate?: string;
}

interface OrgState {
  deptTreeData: Department[];
  employees: Employee[];
  dataScope: Record<string, { type: string; depts: string[] }>;
  setDeptTreeData: (data: Department[]) => void;
  addDepartment: (parentKey: string | null, newDept: Department) => void;
  updateDepartment: (deptKey: string, updates: { title?: string; parentKey?: string | null }) => void;
  deleteDepartment: (deptKey: string) => void;
  setEmployees: (data: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (key: string, updates: Partial<Employee>) => void;
  deleteEmployee: (key: string) => void;
  toggleEmployeeDisable: (key: string) => void;
  setDataScope: (data: Record<string, { type: string; depts: string[] }>) => void;
  updateDataScope: (role: string, updates: { type?: string; depts?: string[] }) => void;
  cleanUpStaleDeptKeys: (validDeptKeys: string[]) => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
  deptTreeData: [],
  employees: [],
  dataScope: {},

  setDeptTreeData: (data) => set({ deptTreeData: data }),

  addDepartment: (parentKey, newDept) => {
    set((state) => {
      if (!parentKey) {
        return { deptTreeData: [...state.deptTreeData, newDept] };
      }
      const addDeptToTree = (tree: Department[], pk: string, dept: Department): Department[] => {
        return tree.map((d) => {
          if (d.key === pk) {
            return {
              ...d,
              children: [...(d.children || []), dept],
              isLeaf: false,
            };
          }
          if (d.children) {
            return { ...d, children: addDeptToTree(d.children, pk, dept) };
          }
          return d;
        });
      };
      return { deptTreeData: addDeptToTree(state.deptTreeData, parentKey, newDept) };
    });
  },

  updateDepartment: (deptKey, updates) => {
    set((state) => {
      let newTree = state.deptTreeData;
      const { title: newName, parentKey: newParentKey } = updates;

      const findParentKey = (tree: Department[], targetKey: string): string | null => {
        for (const dept of tree) {
          if (dept.children?.some((c) => c.key === targetKey)) {
            return dept.key;
          }
          if (dept.children) {
            const found = findParentKey(dept.children, targetKey);
            if (found) return found;
          }
        }
        return null;
      };

      const removeDeptFromTree = (tree: Department[], dk: string): Department[] => {
        return tree
          .map((dept) => {
            if (dept.key === dk) return null;
            if (dept.children) {
              const newChildren = removeDeptFromTree(dept.children, dk).filter(Boolean);
              return {
                ...dept,
                children: newChildren.length > 0 ? newChildren : undefined,
                isLeaf: newChildren.length === 0,
              };
            }
            return dept;
          })
          .filter(Boolean) as Department[];
      };

      if (newParentKey !== undefined) {
        const currentParent = findParentKey(newTree, deptKey);
        if (currentParent !== newParentKey) {
          const removedTree = removeDeptFromTree(newTree, deptKey);
          const findDept = (tree: Department[], dk: string): Department | undefined => {
            for (const dept of tree) {
              if (dept.key === dk) return dept;
              if (dept.children) {
                const found = findDept(dept.children, dk);
                if (found) return found;
              }
            }
            return undefined;
          };
          const movedDept = findDept(state.deptTreeData, deptKey);
          if (movedDept) {
            if (!newParentKey) {
              newTree = [...removedTree, movedDept];
            } else {
              const addDeptToTree = (tree: Department[], pk: string, dept: Department): Department[] => {
                return tree.map((d) => {
                  if (d.key === pk) {
                    return {
                      ...d,
                      children: [...(d.children || []), dept],
                      isLeaf: false,
                    };
                  }
                  if (d.children) {
                    return { ...d, children: addDeptToTree(d.children, pk, dept) };
                  }
                  return d;
                });
              };
              newTree = addDeptToTree(removedTree, newParentKey, movedDept);
            }
          }
        }
      }

      if (newName) {
        const updateDeptName = (tree: Department[], dk: string, name: string): Department[] => {
          return tree.map((dept) => {
            if (dept.key === dk) return { ...dept, title: name };
            if (dept.children) return { ...dept, children: updateDeptName(dept.children, dk, name) };
            return dept;
          });
        };
        newTree = updateDeptName(newTree, deptKey, newName);
      }

      return { deptTreeData: newTree };
    });
  },

  deleteDepartment: (deptKey) => {
    set((state) => {
      const removeDept = (tree: Department[], dk: string): Department[] => {
        return tree
          .map((dept) => {
            if (dept.key === dk) return null;
            if (dept.children) {
              const newChildren = removeDept(dept.children, dk).filter(Boolean);
              return {
                ...dept,
                children: newChildren.length > 0 ? newChildren : undefined,
                isLeaf: newChildren.length === 0,
              };
            }
            return dept;
          })
          .filter(Boolean) as Department[];
      };
      return { deptTreeData: removeDept(state.deptTreeData, deptKey) };
    });
  },

  setEmployees: (data) => set({ employees: data }),

  addEmployee: (employee) => set((state) => ({ employees: [employee, ...state.employees] })),

  updateEmployee: (key, updates) =>
    set((state) => ({
      employees: state.employees.map((e) => (e.key === key ? { ...e, ...updates } : e)),
    })),

  deleteEmployee: (key) =>
    set((state) => ({ employees: state.employees.filter((e) => e.key !== key) })),

  toggleEmployeeDisable: (key) =>
    set((state) => ({
      employees: state.employees.map((e) =>
        e.key === key ? { ...e, status: e.status === 'active' ? 'disabled' : 'active' } : e
      ),
    })),

  setDataScope: (data) => set({ dataScope: data }),

  updateDataScope: (role, updates) =>
    set((state) => ({
      dataScope: {
        ...state.dataScope,
        [role]: { ...state.dataScope[role], ...updates },
      },
    })),

  cleanUpStaleDeptKeys: (validDeptKeys) =>
    set((state) => ({
      dataScope: Object.fromEntries(
        Object.entries(state.dataScope).map(([role, scope]) => [
          role,
          {
            ...scope,
            depts: scope.depts.filter((dk) => validDeptKeys.includes(dk)),
          },
        ])
      ),
    })),
  }),
  {
    name: 'client_org_data',
    partialize: (state) => ({ deptTreeData: state.deptTreeData, employees: state.employees, dataScope: state.dataScope }),
  }
));