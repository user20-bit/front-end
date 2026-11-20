export const catalog = [
  ['RP-001','Servicio integral de limpieza de sedes administrativas','Municipalidad de Miraflores','Lima','Limpieza',285000,12,3,'2026-12-18'],
  ['RP-002','Supervisión de obra para el mejoramiento vial urbano','Gobierno Regional de Arequipa','Arequipa','Consultoría',410000,8,2,'2026-12-22'],
  ['RP-003','Mantenimiento preventivo de equipos informáticos','Universidad Nacional de Trujillo','La Libertad','Tecnología',96000,6,1,'2026-12-28'],
  ['RP-004','Servicio de seguridad y vigilancia para oficinas','Municipalidad Provincial del Cusco','Cusco','Seguridad',320000,12,2,'2027-01-08'],
  ['RP-005','Limpieza y desinfección para centros de atención','Red de Salud Lima Centro','Lima','Limpieza',192000,9,2,'2027-01-14'],
  ['RP-006','Soporte técnico y mesa de ayuda institucional','Gobierno Regional de Arequipa','Arequipa','Tecnología',125000,12,1,'2027-01-20'],
].map(([id,title,entity,region,category,budget,months,sites,deadline]) => ({
  id,title,entity,region,category,budget,months,sites,deadline,
  requirements: [
    {id:'experiencia',title:`Experiencia acreditada en ${category.toLowerCase()}`,clause:'3.2.1',page:12},
    {id:'personal',title:'Constancia de experiencia del responsable',clause:'3.2.2',page:14},
    {id:'declaracion',title:'Declaración jurada del postor',clause:'2.2.1',page:7},
  ],
  history:{winner:'Servicios del Perú Demo S.A.C.',bidders:3,amount:Math.round(budget * 0.91),months,sites,source:'Acta simulada, página 5',evaluation:'Puntaje referencial: 95/100. Evaluadores sin registro en la muestra.'},
}));
