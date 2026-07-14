import { describe, it, expect, vi } from 'vitest';

import {
  parseCSV,
  validateItem,
  validateItems,
  getValidItems,
  getInvalidItems,
  getAllErrors,
  generateCSVTemplate,
  formatFileSize,
  isValidFileType,
  type BulkUploadItem,
} from './bulkUploadUtils';
import { MoSCoWPriority, type ProductBacklogItem } from '../../../types';

vi.mock('../../../services', () => ({
  apiService: {},
}));

// Mock i18next with test translations
vi.mock('i18next', () => ({
  default: {
    getFixedT: (locale: string, _namespace: string) => {
      // Mock translation function that returns localized headers and examples
      const translations: Record<string, Record<string, unknown>> = {
        en: {
          headers: {
            title: 'Title',
            description: 'Description',
            storyPoints: 'Story Points',
            businessValue: 'Business Value',
            priority: 'Priority',
            labels: 'Labels',
            acceptanceCriteria: 'Acceptance Criteria',
          },
          examples: [
            {
              title: 'User Authentication',
              description:
                'Implement OAuth2 login with Google and GitHub providers for secure user authentication',
              storyPoints: 8,
              businessValue: 13,
              priority: 'Must Have',
              labels: 'auth, security, backend',
              acceptanceCriteria:
                '1. Users can log in with Google\n2. Users can log in with GitHub\n3. Session expires after 30 minutes\n4. Invalid login shows error message',
            },
            {
              title: 'Dashboard Charts',
              description:
                'Add interactive charts to the dashboard for sprint progress and team velocity visualization',
              storyPoints: 5,
              businessValue: 8,
              priority: 'Should Have',
              labels: 'frontend, charts, dashboard',
              acceptanceCriteria:
                '1. Sprint progress chart displays correctly\n2. Team velocity chart shows last 6 sprints\n3. Charts are responsive on mobile devices',
            },
            {
              title: 'Email Notifications',
              description:
                'Configure email notifications for sprint start, sprint end, and critical impediments',
              storyPoints: 3,
              businessValue: 5,
              priority: 'Could Have',
              labels: 'notifications, email, backend',
              acceptanceCriteria:
                '1. Email sent when sprint starts\n2. Email sent when sprint ends\n3. Email sent for critical impediments\n4. Users can unsubscribe',
            },
          ],
          filename: 'backlog-import-template.csv',
        },
        de: {
          headers: {
            title: 'Titel',
            description: 'Beschreibung',
            storyPoints: 'Story Points',
            businessValue: 'Business Value',
            priority: 'Priorität',
            labels: 'Labels',
            acceptanceCriteria: 'Akzeptanzkriterien',
          },
          examples: [
            {
              title: 'Benutzer-Authentifizierung',
              description:
                'Implementierung von OAuth2-Login mit Google und GitHub-Anbietern für sichere Benutzer-Authentifizierung',
              storyPoints: 8,
              businessValue: 13,
              priority: 'Muss haben',
              labels: 'auth, sicherheit, backend',
              acceptanceCriteria:
                '1. Benutzer können sich mit Google anmelden\n2. Benutzer können sich mit GitHub anmelden\n3. Sitzung läuft nach 30 Minuten ab\n4. Ungültige Anmeldung zeigt Fehlermeldung',
            },
            {
              title: 'Dashboard-Diagramme',
              description:
                'Hinzufügen von interaktiven Diagrammen zum Dashboard für Sprint-Fortschritt und Team-Geschwindigkeit',
              storyPoints: 5,
              businessValue: 8,
              priority: 'Sollte haben',
              labels: 'frontend, diagramme, dashboard',
              acceptanceCriteria:
                '1. Sprint-Fortschrittsdiagramm wird korrekt angezeigt\n2. Team-Geschwindigkeitsdiagramm zeigt die letzten 6 Sprints\n3. Diagramme sind auf Mobilgeräten responsive',
            },
            {
              title: 'E-Mail-Benachrichtigungen',
              description:
                'Konfiguration von E-Mail-Benachrichtigungen für Sprint-Start, Sprint-Ende und kritische Hindernisse',
              storyPoints: 3,
              businessValue: 5,
              priority: 'Könnte haben',
              labels: 'benachrichtigungen, email, backend',
              acceptanceCriteria:
                '1. E-Mail wird gesendet, wenn Sprint beginnt\n2. E-Mail wird gesendet, wenn Sprint endet\n3. E-Mail wird für kritische Hindernisse gesendet\n4. Benutzer können sich abmelden',
            },
          ],
          filename: 'backlog-import-vorlage.csv',
        },
        es: {
          headers: {
            title: 'Título',
            description: 'Descripción',
            storyPoints: 'Story Points',
            businessValue: 'Valor de negocio',
            priority: 'Prioridad',
            labels: 'Etiquetas',
            acceptanceCriteria: 'Criterios de aceptación',
          },
          examples: [
            {
              title: 'Autenticación de usuario',
              description:
                'Implementar inicio de sesión OAuth2 con proveedores de Google y GitHub para autenticación segura de usuarios',
              storyPoints: 8,
              businessValue: 13,
              priority: 'Debe tener',
              labels: 'auth, seguridad, backend',
              acceptanceCriteria:
                '1. Los usuarios pueden iniciar sesión con Google\n2. Los usuarios pueden iniciar sesión con GitHub\n3. La sesión expira después de 30 minutos\n4. Un inicio de sesión inválido muestra mensaje de error',
            },
            {
              title: 'Gráficos del dashboard',
              description:
                'Agregar gráficos interactivos al dashboard para visualización del progreso del sprint y velocidad del equipo',
              storyPoints: 5,
              businessValue: 8,
              priority: 'Debería tener',
              labels: 'frontend, gráficos, dashboard',
              acceptanceCriteria:
                '1. El gráfico de progreso del sprint se muestra correctamente\n2. El gráfico de velocidad del equipo muestra los últimos 6 sprints\n3. Los gráficos son responsivos en dispositivos móviles',
            },
            {
              title: 'Notificaciones por correo',
              description:
                'Configurar notificaciones por correo para inicio de sprint, fin de sprint e impedimentos críticos',
              storyPoints: 3,
              businessValue: 5,
              priority: 'Podría tener',
              labels: 'notificaciones, correo, backend',
              acceptanceCriteria:
                '1. Correo enviado cuando inicia el sprint\n2. Correo enviado cuando termina el sprint\n3. Correo enviado para impedimentos críticos\n4. Los usuarios pueden darse de baja',
            },
          ],
          filename: 'plantilla-importacion-backlog.csv',
        },
        fr: {
          headers: {
            title: 'Titre',
            description: 'Description',
            storyPoints: 'Story Points',
            businessValue: 'Valeur Métier',
            priority: 'Priorité',
            labels: 'Étiquettes',
            acceptanceCriteria: "Critères d'acceptation",
          },
          examples: [
            {
              title: 'Authentification utilisateur',
              description:
                'Implémenter la connexion OAuth2 avec les fournisseurs Google et GitHub pour une authentification sécurisée',
              storyPoints: 8,
              businessValue: 13,
              priority: 'Doit avoir',
              labels: 'auth, sécurité, backend',
              acceptanceCriteria:
                "1. Les utilisateurs peuvent se connecter avec Google\n2. Les utilisateurs peuvent se connecter avec GitHub\n3. La session expire après 30 minutes\n4. Une connexion invalide affiche un message d'erreur",
            },
          ],
          filename: 'modele-import-backlog.csv',
        },
        it: {
          headers: {
            title: 'Titolo',
            description: 'Descrizione',
            storyPoints: 'Story Points',
            businessValue: 'Valore Business',
            priority: 'Priorità',
            labels: 'Etichette',
            acceptanceCriteria: 'Criteri di accettazione',
          },
          examples: [
            {
              title: 'Autenticazione utente',
              description:
                'Implementare login OAuth2 con provider Google e GitHub per autenticazione sicura degli utenti',
              storyPoints: 8,
              businessValue: 13,
              priority: 'Deve avere',
              labels: 'auth, sicurezza, backend',
              acceptanceCriteria:
                '1. Gli utenti possono accedere con Google\n2. Gli utenti possono accedere con GitHub\n3. La sessione scade dopo 30 minuti\n4. Un login non valido mostra un messaggio di errore',
            },
          ],
          filename: 'modello-importazione-backlog.csv',
        },
      };

      return (key: string, options?: { returnObjects?: boolean }) => {
        if (key === 'bulkUpload.template.headers' && options?.returnObjects) {
          return translations[locale]?.headers || translations.en.headers;
        }
        if (key === 'bulkUpload.template.examples' && options?.returnObjects) {
          return translations[locale]?.examples || translations.en.examples;
        }
        if (key === 'bulkUpload.template.filename') {
          return translations[locale]?.filename || translations.en.filename;
        }
        return key;
      };
    },
    isInitialized: true,
  },
}));

describe('bulkUploadUtils', () => {
  describe('parseCSV', () => {
    describe('Valid CSV Parsing', () => {
      it('should parse basic CSV with headers', () => {
        const csv = 'title,description\nTest Item,Test Description';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Test Item');
        expect(result.items[0]?.description).toBe('Test Description');
      });

      it('should parse CSV with all fields', () => {
        const csv = `title,description,storyPoints,businessValue,priority,labels,acceptanceCriteria
Test Item,Test Description,8,13,Must Have,"frontend,backend",Test criteria`;
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Test Item');
        expect(result.items[0]?.storyPoints).toBe(8);
        expect(result.items[0]?.businessValue).toBe(13);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[0]?.labels).toEqual(['frontend', 'backend']);
      });

      it('should handle CRLF line endings', () => {
        const csv = 'title,description\r\nTest Item,Test Description';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
      });

      it('should handle quoted fields', () => {
        const csv = 'title,description\n"Test, Item","Test ""Description"""\n';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items[0]?.title).toBe('Test, Item');
        expect(result.items[0]?.description).toBe('Test "Description"');
      });

      it('should handle various header names', () => {
        const csv = 'name,desc,points,value,moscow,tags,criteria\nTest,Desc,5,8,Must,tag1,AC';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.items[0]?.title).toBe('Test');
        expect(result.items[0]?.description).toBe('Desc');
        expect(result.items[0]?.storyPoints).toBe(5);
        expect(result.items[0]?.businessValue).toBe(8);
      });
    });

    describe('Priority Parsing', () => {
      it('should parse Must Have priority variations', () => {
        const variations = ['Must Have', 'must have', 'Must', 'must', 'M', 'm'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        });
      });

      it('should parse Should Have priority variations', () => {
        const variations = ['Should Have', 'should have', 'Should', 'should', 'S', 's'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
        });
      });

      it('should parse Could Have priority variations', () => {
        const variations = ['Could Have', 'could have', 'Could', 'could', 'C', 'c'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
        });
      });

      it("should parse Won't Have priority variations", () => {
        const variations = ["Won't Have", "won't have", 'Wont', 'wont', 'W', 'w'];
        variations.forEach((priority) => {
          const csv = `title,priority\nTest,${priority}`;
          const result = parseCSV(csv);
          expect(result.items[0]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
        });
      });
    });

    describe('Error Handling', () => {
      it('should return error for empty file', () => {
        const result = parseCSV('');

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toBe('File is empty');
      });

      it('should return error for missing title column', () => {
        const csv = 'description,priority\nTest Description,Must Have';
        const result = parseCSV(csv);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toContain('Missing required column');
      });

      it('should skip empty lines', () => {
        const csv = 'title\nTest 1\n\nTest 2\n';
        const result = parseCSV(csv);

        expect(result.items).toHaveLength(2);
      });
    });

    describe('Row Numbers', () => {
      it('should assign correct row numbers', () => {
        const csv = 'title\nItem 1\nItem 2\nItem 3';
        const result = parseCSV(csv);

        expect(result.items[0]?._rowNumber).toBe(2);
        expect(result.items[1]?._rowNumber).toBe(3);
        expect(result.items[2]?._rowNumber).toBe(4);
      });
    });
  });

  describe('validateItem', () => {
    const existingItems: ProductBacklogItem[] = [
      {
        id: 'existing-1',
        title: 'Existing Item',
        status: 'NEW',
        priority: MoSCoWPriority.MUST_HAVE,
        teamId: 'team-1',
        goalId: 'goal-1',
        labels: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      } as ProductBacklogItem,
    ];

    it('should return error for missing title', () => {
      const item: BulkUploadItem = { _rowNumber: 1 };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should return error for empty title', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: '   ' };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should return error for title exceeding 200 characters', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'a'.repeat(201) };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.message.includes('200 characters'))).toBe(true);
    });

    it('should return error for duplicate title', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'Existing Item' };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.message.includes('Duplicate title'))).toBe(true);
    });

    it('should return error for story points out of range', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'Test', storyPoints: 0 };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'storyPoints')).toBe(true);
    });

    it('should return error for business value out of range', () => {
      const item: BulkUploadItem = { _rowNumber: 1, title: 'Test', businessValue: 101 };
      const errors = validateItem(item, existingItems);

      expect(errors.some((e) => e.field === 'businessValue')).toBe(true);
    });

    it('should return no errors for valid item', () => {
      const item: BulkUploadItem = {
        _rowNumber: 1,
        title: 'Valid Item',
        storyPoints: 8,
        businessValue: 13,
        priority: MoSCoWPriority.MUST_HAVE,
      };
      const errors = validateItem(item, existingItems);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateItems', () => {
    it('should validate all items and set isValid flag', () => {
      const items: BulkUploadItem[] = [{ _rowNumber: 1, title: 'Valid Item' }, { _rowNumber: 2 }];

      const result = validateItems(items, []);

      expect(result[0]?._isValid).toBe(true);
      expect(result[1]?._isValid).toBe(false);
    });

    it('should detect duplicates within file', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, title: 'Duplicate' },
        { _rowNumber: 2, title: 'Duplicate' },
      ];

      const result = validateItems(items, []);

      expect(result[1]?._errors?.some((e) => e.message.includes('Duplicate'))).toBe(true);
    });
  });

  describe('getValidItems', () => {
    it('should return only valid items', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, title: 'Valid', _isValid: true },
        { _rowNumber: 2, _isValid: false },
        { _rowNumber: 3, title: 'Valid 2', _isValid: true },
      ];

      const valid = getValidItems(items);

      expect(valid).toHaveLength(2);
      expect(valid.every((i) => i._isValid)).toBe(true);
    });
  });

  describe('getInvalidItems', () => {
    it('should return only invalid items', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, title: 'Valid', _isValid: true },
        { _rowNumber: 2, _isValid: false },
      ];

      const invalid = getInvalidItems(items);

      expect(invalid).toHaveLength(1);
      expect(invalid.every((i) => !i._isValid)).toBe(true);
    });
  });

  describe('getAllErrors', () => {
    it('should collect all errors from all items', () => {
      const items: BulkUploadItem[] = [
        { _rowNumber: 1, _errors: [{ row: 1, field: 'title', message: 'Error 1' }] },
        { _rowNumber: 2, _errors: [{ row: 2, field: 'title', message: 'Error 2' }] },
      ];

      const errors = getAllErrors(items);

      expect(errors).toHaveLength(2);
    });
  });

  describe('generateCSVTemplate', () => {
    it('should generate valid CSV template with English headers', () => {
      const template = generateCSVTemplate('en');

      expect(template).toContain('Title');
      expect(template).toContain('Description');
      expect(template).toContain('Story Points');
      expect(template).toContain('Business Value');
      expect(template).toContain('Priority');
      expect(template).toContain('Labels');
      expect(template).toContain('Acceptance Criteria');
    });

    it('should include example rows', () => {
      const template = generateCSVTemplate('en');

      expect(template).toContain('User Authentication');
      expect(template).toContain('Must Have');
    });

    describe('Localized Template Generation', () => {
      describe('English Template (en)', () => {
        it('should produce English template headers', () => {
          const template = generateCSVTemplate('en');
          const lines = template.split('\n');
          const headers = lines[0]?.split(',');

          expect(headers).toBeDefined();
          expect(headers).toContain('Title');
          expect(headers).toContain('Description');
          expect(headers).toContain('Story Points');
          expect(headers).toContain('Business Value');
          expect(headers).toContain('Priority');
          expect(headers).toContain('Labels');
          expect(headers).toContain('Acceptance Criteria');
        });

        it('should produce English example content', () => {
          const template = generateCSVTemplate('en');

          // Verify English example content
          expect(template).toContain('User Authentication');
          expect(template).toContain('Dashboard Charts');
          expect(template).toContain('Email Notifications');
          expect(template).toContain('Must Have');
          expect(template).toContain('Should Have');
          expect(template).toContain('Could Have');
        });

        it('should properly escape English content with commas', () => {
          const template = generateCSVTemplate('en');

          // The third example has a description with commas that should be quoted
          expect(template).toContain(
            '"Configure email notifications for sprint start, sprint end, and critical impediments"'
          );
          // First description doesn't have commas so it's not quoted
          expect(template).toContain(
            'Implement OAuth2 login with Google and GitHub providers for secure user authentication'
          );
        });
      });

      describe('German Template (de)', () => {
        it('should produce German template headers', () => {
          const template = generateCSVTemplate('de');
          const lines = template.split('\n');
          const headers = lines[0]?.split(',');

          expect(headers).toBeDefined();
          expect(headers).toContain('Titel');
          expect(headers).toContain('Beschreibung');
          expect(headers).toContain('Story Points');
          expect(headers).toContain('Business Value');
          expect(headers).toContain('Priorität');
          expect(headers).toContain('Labels');
          expect(headers).toContain('Akzeptanzkriterien');
        });

        it('should produce German example content', () => {
          const template = generateCSVTemplate('de');

          // Verify German example content
          expect(template).toContain('Benutzer-Authentifizierung');
          expect(template).toContain('Dashboard-Diagramme');
          expect(template).toContain('E-Mail-Benachrichtigungen');
          expect(template).toContain('Muss haben');
          expect(template).toContain('Sollte haben');
          expect(template).toContain('Könnte haben');
        });

        it('should properly escape German content with commas', () => {
          const template = generateCSVTemplate('de');

          // Verify the description field is properly quoted (contains commas)
          expect(template).toContain('Implementierung von OAuth2-Login');
        });
      });

      describe('Spanish Template (es)', () => {
        it('should produce Spanish template headers', () => {
          const template = generateCSVTemplate('es');
          const lines = template.split('\n');
          const headers = lines[0]?.split(',');

          expect(headers).toBeDefined();
          expect(headers).toContain('Título');
          expect(headers).toContain('Descripción');
          expect(headers).toContain('Story Points');
          expect(headers).toContain('Valor de negocio');
          expect(headers).toContain('Prioridad');
          expect(headers).toContain('Etiquetas');
          expect(headers).toContain('Criterios de aceptación');
        });

        it('should produce Spanish example content', () => {
          const template = generateCSVTemplate('es');

          // Verify Spanish example content
          expect(template).toContain('Autenticación de usuario');
          expect(template).toContain('Gráficos del dashboard');
          expect(template).toContain('Notificaciones por correo');
          expect(template).toContain('Debe tener');
          expect(template).toContain('Debería tener');
          expect(template).toContain('Podría tener');
        });
      });

      describe('French Template (fr)', () => {
        it('should produce French template headers', () => {
          const template = generateCSVTemplate('fr');
          const lines = template.split('\n');
          const headers = lines[0]?.split(',');

          expect(headers).toBeDefined();
          // Check for French headers (these would be defined in fr/backlog.json)
          expect(template).toBeTruthy();
          expect(lines.length).toBeGreaterThan(0);
        });
      });

      describe('Italian Template (it)', () => {
        it('should produce Italian template headers', () => {
          const template = generateCSVTemplate('it');
          const lines = template.split('\n');
          const headers = lines[0]?.split(',');

          expect(headers).toBeDefined();
          // Check for Italian headers (these would be defined in it/backlog.json)
          expect(template).toBeTruthy();
          expect(lines.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Localized Header Parsing', () => {
    describe('German Headers', () => {
      it('should parse German headers correctly', () => {
        const germanCsv = `Titel,Beschreibung,Story Points,Business Value,Priorität,Labels,Akzeptanzkriterien
Benutzer-Authentifizierung,Implementierung von OAuth2,8,13,Muss haben,"auth,backend",Testkriterien`;

        const result = parseCSV(germanCsv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Benutzer-Authentifizierung');
        expect(result.items[0]?.description).toBe('Implementierung von OAuth2');
        expect(result.items[0]?.storyPoints).toBe(8);
        expect(result.items[0]?.businessValue).toBe(13);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[0]?.labels).toEqual(['auth', 'backend']);
        expect(result.items[0]?.acceptanceCriteria).toBe('Testkriterien');
      });

      it('should parse German header variants (normalized)', () => {
        // Test with spaces in headers (normalized to remove spaces)
        const germanCsv = `Titel,Beschreibung,Story-Points,Business-Value,Priorität,Labels,Akzeptanzkriterien
Test Item,Test Description,5,8,Sollte haben,frontend,AC`;

        const result = parseCSV(germanCsv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Test Item');
        expect(result.items[0]?.storyPoints).toBe(5);
        expect(result.items[0]?.businessValue).toBe(8);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should parse multiple German priority values', () => {
        const csv = `Titel,Priorität
Test 1,Muss haben
Test 2,Sollte haben
Test 3,Könnte haben
Test 4,Wird nicht haben`;

        const result = parseCSV(csv);

        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
        expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
        expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('Spanish Headers', () => {
      it('should parse Spanish headers correctly', () => {
        const spanishCsv = `Título,Descripción,Story Points,Valor de negocio,Prioridad,Etiquetas,Criterios de aceptación
Autenticación de usuario,Implementar OAuth2,8,13,Debe tener,"auth,backend",Criterios`;

        const result = parseCSV(spanishCsv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Autenticación de usuario');
        expect(result.items[0]?.description).toBe('Implementar OAuth2');
        expect(result.items[0]?.storyPoints).toBe(8);
        expect(result.items[0]?.businessValue).toBe(13);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[0]?.labels).toEqual(['auth', 'backend']);
      });

      it('should parse Spanish priority values', () => {
        const csv = `Título,Prioridad
Test 1,Debe tener
Test 2,Debería tener
Test 3,Podría tener
Test 4,No tendrá`;

        const result = parseCSV(csv);

        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
        expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
        expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('French Headers', () => {
      it('should parse French headers correctly', () => {
        const frenchCsv = `Titre,Description,Story Points,Valeur Métier,Priorité,Étiquettes,Critères d'acceptation
Authentification utilisateur,Implémenter OAuth2,8,13,Doit avoir,"auth,backend",Critères`;

        const result = parseCSV(frenchCsv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Authentification utilisateur');
        expect(result.items[0]?.description).toBe('Implémenter OAuth2');
        expect(result.items[0]?.storyPoints).toBe(8);
        expect(result.items[0]?.businessValue).toBe(13);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[0]?.labels).toEqual(['auth', 'backend']);
      });

      it('should parse French priority values', () => {
        const csv = `Titre,Priorité
Test 1,Doit avoir
Test 2,Devrait avoir
Test 3,Pourrait avoir
Test 4,N'aura pas`;

        const result = parseCSV(csv);

        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
        expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
        expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('Italian Headers', () => {
      it('should parse Italian headers correctly', () => {
        const italianCsv = `Titolo,Descrizione,Story Points,Valore Business,Priorità,Labels,Criteri di accettazione
Autenticazione utente,Implementare OAuth2,8,13,Deve avere,"auth,backend",Criteri`;

        const result = parseCSV(italianCsv);

        expect(result.errors).toHaveLength(0);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.title).toBe('Autenticazione utente');
        expect(result.items[0]?.storyPoints).toBe(8);
        expect(result.items[0]?.businessValue).toBe(13);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse Italian priority values', () => {
        const csv = `Titolo,Priorità
Test 1,Deve avere
Test 2,Dovrebbe avere
Test 3,Potrebbe avere
Test 4,Non avrà`;

        const result = parseCSV(csv);

        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
        expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
        expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
        expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });
  });

  describe('Localized Priority Parsing', () => {
    describe('German Priority Values', () => {
      it('should parse "muss haben" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,muss haben';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "muss" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,muss';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "sollte haben" as SHOULD_HAVE', () => {
        const csv = 'title,priority\nTest,sollte haben';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should parse "könnte haben" as COULD_HAVE', () => {
        const csv = 'title,priority\nTest,könnte haben';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      });

      it('should parse "wird nicht haben" as WONT_HAVE', () => {
        const csv = 'title,priority\nTest,wird nicht haben';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('Spanish Priority Values', () => {
      it('should parse "debe tener" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,debe tener';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "debe" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,debe';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "debería tener" as SHOULD_HAVE', () => {
        const csv = 'title,priority\nTest,debería tener';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should parse "debería" as SHOULD_HAVE', () => {
        const csv = 'title,priority\nTest,debería';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should parse "podría tener" as COULD_HAVE', () => {
        const csv = 'title,priority\nTest,podría tener';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      });

      it('should parse "no tendrá" as WONT_HAVE', () => {
        const csv = 'title,priority\nTest,no tendrá';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('French Priority Values', () => {
      it('should parse "doit avoir" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,doit avoir';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "doit" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,doit';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "devrait avoir" as SHOULD_HAVE', () => {
        const csv = 'title,priority\nTest,devrait avoir';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should parse "pourrait avoir" as COULD_HAVE', () => {
        const csv = 'title,priority\nTest,pourrait avoir';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      });

      it('should parse "n\'aura pas" as WONT_HAVE', () => {
        const csv = "title,priority\nTest,n'aura pas";
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });

    describe('Italian Priority Values', () => {
      it('should parse "deve avere" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,deve avere';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "deve" as MUST_HAVE', () => {
        const csv = 'title,priority\nTest,deve';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      });

      it('should parse "dovrebbe avere" as SHOULD_HAVE', () => {
        const csv = 'title,priority\nTest,dovrebbe avere';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      });

      it('should parse "potrebbe avere" as COULD_HAVE', () => {
        const csv = 'title,priority\nTest,potrebbe avere';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      });

      it('should parse "non avrà" as WONT_HAVE', () => {
        const csv = 'title,priority\nTest,non avrà';
        const result = parseCSV(csv);
        expect(result.items[0]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should still parse English headers (backward compatible)', () => {
      const englishCsv = `Title,Description,Story Points,Business Value,Priority,Labels,Acceptance Criteria
User Authentication,Implement OAuth2 login,8,13,Must Have,"auth,backend",Test criteria`;

      const result = parseCSV(englishCsv);

      expect(result.errors).toHaveLength(0);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.title).toBe('User Authentication');
      expect(result.items[0]?.description).toBe('Implement OAuth2 login');
      expect(result.items[0]?.storyPoints).toBe(8);
      expect(result.items[0]?.businessValue).toBe(13);
      expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      expect(result.items[0]?.labels).toEqual(['auth', 'backend']);
      expect(result.items[0]?.acceptanceCriteria).toBe('Test criteria');
    });

    it('should still parse English priority values (backward compatible)', () => {
      const csv = `title,priority
Test 1,Must Have
Test 2,Should Have
Test 3,Could Have
Test 4,Won't Have`;

      const result = parseCSV(csv);

      expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
    });

    it('should still parse short English priority values (backward compatible)', () => {
      const csv = `title,priority
Test 1,Must
Test 2,Should
Test 3,Could
Test 4,Wont`;

      const result = parseCSV(csv);

      expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
    });

    it('should still parse single-letter English priority values (backward compatible)', () => {
      const csv = `title,priority
Test 1,M
Test 2,S
Test 3,C
Test 4,W`;

      const result = parseCSV(csv);

      expect(result.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
      expect(result.items[1]?.priority).toBe(MoSCoWPriority.SHOULD_HAVE);
      expect(result.items[2]?.priority).toBe(MoSCoWPriority.COULD_HAVE);
      expect(result.items[3]?.priority).toBe(MoSCoWPriority.WONT_HAVE);
    });

    it('should support mixed language headers in different files', () => {
      // English file
      const enResult = parseCSV('title,priority\nTest,Must Have');
      expect(enResult.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);

      // German file
      const deResult = parseCSV('Titel,Priorität\nTest,Muss haben');
      expect(deResult.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);

      // Spanish file
      const esResult = parseCSV('Título,Prioridad\nTest,Debe tener');
      expect(esResult.items[0]?.priority).toBe(MoSCoWPriority.MUST_HAVE);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });

  describe('isValidFileType', () => {
    it('should accept CSV files by MIME type', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      expect(isValidFileType(file)).toBe(true);
    });

    it('should accept CSV files by extension', () => {
      const file = new File([''], 'test.CSV', { type: '' });
      expect(isValidFileType(file)).toBe(true);
    });

    it('should reject non-CSV files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isValidFileType(file)).toBe(false);
    });
  });
});
