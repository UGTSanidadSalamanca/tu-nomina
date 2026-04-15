/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Calculator, Info, AlertCircle, ChevronRight, Euro, Receipt } from 'lucide-react';
import {
  POSITIONS,
  TRIENIOS,
  TRIENIOS_EXTRA,
  CARRERA_PROFESIONAL,
  TURNICIDAD,
  GUARDIA_HORAS,
  NOCHES,
  FESTIVOS_DIURNOS
} from './data';
// import { Chat } from './components/Chat';

export default function App() {
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [trienios, setTrienios] = useState<number>(0);
  const [carrera, setCarrera] = useState<string>('');
  const [turnicidad, setTurnicidad] = useState<string>('');

  // Atención Continuada
  const [guardiasLaborables, setGuardiasLaborables] = useState<number>(0);
  const [guardiasFestivas, setGuardiasFestivas] = useState<number>(0);
  const [guardiasEspeciales, setGuardiasEspeciales] = useState<number>(0);

  const [nochesLaborables, setNochesLaborables] = useState<number>(0);
  const [nochesFestivas, setNochesFestivas] = useState<number>(0);
  const [nochesEspeciales, setNochesEspeciales] = useState<number>(0);

  const [festivosDiurnos, setFestivosDiurnos] = useState<number>(0);
  const [festivosEspeciales, setFestivosEspeciales] = useState<number>(0);

  // Pagas Extras
  // Pagas Extras / Tipo de Contrato
  const [tipoContrato, setTipoContrato] = useState<string>('Fijo');
  const prorratearPagas = tipoContrato === 'Eventual';

  // Días trabajados
  const [diasTrabajados, setDiasTrabajados] = useState<number>(30);

  // Deducciones
  const isEventual = tipoContrato === 'Eventual';
  const [irpf, setIrpf] = useState<number>(13.65);
  const [cuotaSindical, setCuotaSindical] = useState<number>(0);

  const selectedPosition = useMemo(() =>
    POSITIONS.find(p => p.id === selectedPositionId),
    [selectedPositionId]);

  const isHoras = selectedPosition?.atencionContinuadaType === 'horas';

  const calculations = useMemo(() => {
    if (!selectedPosition) return null;

    const factorDias = diasTrabajados / 30;

    // Fijas
    const fijasBase = selectedPosition.sueldo +
      selectedPosition.destino +
      selectedPosition.especifico +
      selectedPosition.cpFija +
      selectedPosition.cam +
      selectedPosition.cpFijaAm;
    const fijas = fijasBase * factorDias;

    // Personales
    const trieniosBase = (TRIENIOS[selectedPosition.grupo] || 0) * trienios;
    const trieniosTotal = trieniosBase * factorDias;

    let carreraBase = 0;
    if (carrera && CARRERA_PROFESIONAL[selectedPosition.tipo]?.[selectedPosition.grupo]?.[carrera]) {
      carreraBase = CARRERA_PROFESIONAL[selectedPosition.tipo][selectedPosition.grupo][carrera];
    }
    const carreraTotal = carreraBase * factorDias;
    const personales = trieniosTotal + carreraTotal;

    // Variables
    let variables = 0;

    if (turnicidad && TURNICIDAD[turnicidad]?.[selectedPosition.grupo]) {
      variables += TURNICIDAD[turnicidad][selectedPosition.grupo] * factorDias;
    }

    if (isHoras) {
      variables += guardiasLaborables * (GUARDIA_HORAS.Laborable[selectedPosition.grupo] || 0);
      variables += guardiasFestivas * (GUARDIA_HORAS.Festivo[selectedPosition.grupo] || 0);
      variables += guardiasEspeciales * (GUARDIA_HORAS.Especial[selectedPosition.grupo] || 0);
    } else {
      variables += nochesLaborables * (NOCHES.Laborable[selectedPosition.grupo] || 0);
      variables += nochesFestivas * (NOCHES.Festivo[selectedPosition.grupo] || 0);
      variables += nochesEspeciales * (NOCHES.Especial[selectedPosition.grupo] || 0);

      variables += festivosDiurnos * (FESTIVOS_DIURNOS.Festivo[selectedPosition.grupo] || 0);
      variables += festivosEspeciales * (FESTIVOS_DIURNOS.Especial[selectedPosition.grupo] || 0);
    }

    // Prorrateo Extra (Paga Extra / 6 meses)
    const trieniosExtra = (TRIENIOS_EXTRA[selectedPosition.grupo] || 0) * trienios;
    const pagaExtraTotal = selectedPosition.pExtra + trieniosExtra + carreraBase;
    const prorrateoExtra = (pagaExtraTotal / 6) * factorDias;

    let totalBruto = fijas + personales + variables;
    if (prorratearPagas) {
      totalBruto += prorrateoExtra;
    }

    // Deducciones
    const baseCC = fijas + personales + variables + prorrateoExtra;
    const contingenciasComunes = baseCC * 0.047; // 4.7%
    const formacionProfesional = baseCC * 0.001; // 0.1%
    const mei = baseCC * 0.0015; // 0.15% MEI 2026
    const desempleo = isEventual ? baseCC * 0.0155 : 0; // 1.55% para eventuales
    const totalSS = contingenciasComunes + formacionProfesional + mei + desempleo;

    const baseIRPF = totalBruto;
    const irpfDeduction = baseIRPF * (irpf / 100);

    const totalDeducciones = totalSS + irpfDeduction + cuotaSindical;
    const liquido = totalBruto - totalDeducciones;

    return {
      fijas,
      personales,
      variables,
      totalBruto,
      trieniosTotal,
      carreraTotal,
      prorrateoExtra,
      baseCC,
      baseIRPF,
      contingenciasComunes,
      formacionProfesional,
      mei,
      totalSS,
      desempleo,
      irpfDeduction,
      totalDeducciones,
      liquido
    };
  }, [
    selectedPosition, trienios, carrera, turnicidad,
    guardiasLaborables, guardiasFestivas, guardiasEspeciales,
    nochesLaborables, nochesFestivas, nochesEspeciales,
    festivosDiurnos, festivosEspeciales, isHoras, irpf, cuotaSindical, tipoContrato, diasTrabajados
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-red-600 text-white shadow-md border-b-4 border-red-800">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tu Nómina</h1>
              <p className="text-red-100 text-sm">Radiografía Retributiva • SACYL 2026</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xl font-black tracking-tighter">UGT</div>
            <div className="text-xs font-semibold text-red-100 tracking-widest uppercase">Servicios Públicos</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Formulario */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-sm">1</span>
                  Identificación y Contrato
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categoría Profesional / Puesto
                  </label>
                  <select
                    className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    value={selectedPositionId}
                    onChange={(e) => {
                      setSelectedPositionId(e.target.value);
                      setCarrera('');
                      setTurnicidad('');
                      setGuardiasLaborables(0);
                      setGuardiasFestivas(0);
                      setGuardiasEspeciales(0);
                      setNochesLaborables(0);
                      setNochesFestivas(0);
                      setNochesEspeciales(0);
                      setFestivosDiurnos(0);
                      setFestivosEspeciales(0);
                    }}
                  >
                    <option value="">Seleccione una categoría...</option>
                    <optgroup label="Atención Especializada (Hospitales)">
                      {POSITIONS.filter(p => p.ambito === 'Atención Especializada').map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Atención Primaria (Centros de Salud)">
                      {POSITIONS.filter(p => p.ambito === 'Atención Primaria').map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Emergencias (SUAP / 112)">
                      {POSITIONS.filter(p => p.ambito === 'Emergencias').map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Días trabajados en el mes
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={diasTrabajados}
                      onChange={(e) => setDiasTrabajados(parseInt(e.target.value) || 30)}
                      className="flex-1 accent-red-600"
                    />
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={diasTrabajados}
                        onChange={(e) => setDiasTrabajados(Math.min(30, Math.max(1, parseInt(e.target.value) || 30)))}
                        className="w-full rounded-lg border-slate-300 border p-2 pr-10 text-center text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-sm">días</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Para meses completos, dejar en 30 días (estándar de nómina).</p>
                </div>

                {selectedPosition?.isTIS && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3 text-amber-800">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Atención Primaria:</strong> La Productividad Fija por TIS depende del número de tarjetas y el índice G del centro (Tabla IV). Este calculador utiliza un valor base estimado sin TIS.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedPosition && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-sm">2</span>
                    Complementos y Variables
                  </h2>
                </div>
                <div className="p-6 space-y-8">

                  {/* Antigüedad y Carrera */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Antigüedad (Trienios)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                        value={trienios}
                        onChange={(e) => setTrienios(parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-slate-500 mt-1">Grupo {selectedPosition.grupo}: {TRIENIOS[selectedPosition.grupo]}€/trienio</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Carrera Profesional
                      </label>
                      <select
                        className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                        value={carrera}
                        onChange={(e) => setCarrera(e.target.value)}
                      >
                        <option value="">Sin grado reconocido</option>
                        {CARRERA_PROFESIONAL[selectedPosition.tipo]?.[selectedPosition.grupo]?.['I'] && <option value="I">Grado I</option>}
                        {CARRERA_PROFESIONAL[selectedPosition.tipo]?.[selectedPosition.grupo]?.['II'] && <option value="II">Grado II</option>}
                        {CARRERA_PROFESIONAL[selectedPosition.tipo]?.[selectedPosition.grupo]?.['III'] && <option value="III">Grado III</option>}
                        {CARRERA_PROFESIONAL[selectedPosition.tipo]?.[selectedPosition.grupo]?.['IV'] && <option value="IV">Grado IV</option>}
                      </select>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Turnicidad */}
                  {!isHoras && TURNICIDAD['Diurno']?.[selectedPosition.grupo] !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Turnicidad
                      </label>
                      <select
                        className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                        value={turnicidad}
                        onChange={(e) => setTurnicidad(e.target.value)}
                      >
                        <option value="">Sin turnicidad</option>
                        <option value="Diurno">Turno Diurno Rotatorio</option>
                        <option value="Rotatorio">Turno Rotatorio (con noches)</option>
                      </select>
                    </div>
                  )}

                  {/* Atención Continuada */}
                  <div>
                    <h3 className="text-md font-medium text-slate-800 mb-4">Atención Continuada (Variables del mes)</h3>

                    {isHoras ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Horas Laborables</label>
                          <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={guardiasLaborables} onChange={(e) => setGuardiasLaborables(parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Horas Festivas</label>
                          <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={guardiasFestivas} onChange={(e) => setGuardiasFestivas(parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Horas Especiales</label>
                          <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={guardiasEspeciales} onChange={(e) => setGuardiasEspeciales(parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Noches Laborables</label>
                            <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={nochesLaborables} onChange={(e) => setNochesLaborables(parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Noches Festivas</label>
                            <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={nochesFestivas} onChange={(e) => setNochesFestivas(parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Noches Especiales</label>
                            <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={nochesEspeciales} onChange={(e) => setNochesEspeciales(parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Domingos/Festivos Diurnos</label>
                            <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={festivosDiurnos} onChange={(e) => setFestivosDiurnos(parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Festivos Especiales Diurnos</label>
                            <input type="number" min="0" className="w-full rounded-lg border-slate-300 border p-2" value={festivosEspeciales} onChange={(e) => setFestivosEspeciales(parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Tipo de Contrato */}
                  <div>
                    <h3 className="text-md font-medium text-slate-800 mb-4">Tipo de Contrato</h3>
                    <select 
                      className="w-full rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                      value={tipoContrato}
                      onChange={(e) => setTipoContrato(e.target.value)}
                    >
                      <option value="Fijo">Fijo</option>
                      <option value="Eventual">Eventual</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      {tipoContrato === 'Eventual' 
                        ? 'Al ser eventual, se incluye la parte proporcional de la paga extra en la nómina mensual (prorrateo).' 
                        : 'Al ser fijo, las pagas extras se cobran en los meses correspondientes (no se prorratean).'}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {selectedPosition && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-sm">3</span>
                    Deducciones (IRPF y Cuota Sindical)
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        % I.R.P.F.
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="50"
                          className="w-full rounded-lg border-slate-300 border p-3 pr-8 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                          value={irpf}
                          onChange={(e) => setIrpf(parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-3.5 text-slate-400">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cuota Sindical (Opcional)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full rounded-lg border-slate-300 border p-3 pr-8 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                          value={cuotaSindical}
                          onChange={(e) => setCuotaSindical(parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-3.5 text-slate-400">€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 p-6 text-white border-t-4 border-red-600">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-red-400" />
                  Nómina Estimada
                </h2>
                <p className="text-slate-300 text-sm mt-1">Valores mensuales 2026</p>
              </div>

              {selectedPosition && calculations ? (
                <div className="p-6 space-y-6">

                  {/* Devengos */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Devengos (Bruto)</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-600">Sueldo Base</span><span className="font-medium">{formatCurrency(selectedPosition.sueldo)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">C. Destino</span><span className="font-medium">{formatCurrency(selectedPosition.destino)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">C. Específico</span><span className="font-medium">{formatCurrency(selectedPosition.especifico)}</span></div>
                      {selectedPosition.cpFija > 0 && <div className="flex justify-between"><span className="text-slate-600">C.P. Fija</span><span className="font-medium">{formatCurrency(selectedPosition.cpFija)}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-600">C. Acuerdo Marco</span><span className="font-medium">{formatCurrency(selectedPosition.cam)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">C.P. Fija (AM)</span><span className="font-medium">{formatCurrency(selectedPosition.cpFijaAm)}</span></div>

                      {calculations.trieniosTotal > 0 && <div className="flex justify-between"><span className="text-slate-600">Trienios ({trienios})</span><span className="font-medium">{formatCurrency(calculations.trieniosTotal)}</span></div>}
                      {calculations.carreraTotal > 0 && <div className="flex justify-between"><span className="text-slate-600">Carrera Prof. (G. {carrera})</span><span className="font-medium">{formatCurrency(calculations.carreraTotal)}</span></div>}
                      {calculations.variables > 0 && <div className="flex justify-between"><span className="text-slate-600">Atención Continuada / Turnicidad</span><span className="font-medium">{formatCurrency(calculations.variables)}</span></div>}
                      {prorratearPagas && <div className="flex justify-between"><span className="text-slate-600">Prorrateo Paga Extra</span><span className="font-medium">{formatCurrency(calculations.prorrateoExtra)}</span></div>}

                      <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold text-slate-800">
                        <span>Total Íntegro (Bruto)</span>
                        <span>{formatCurrency(calculations.totalBruto)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deducciones */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Deducciones</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-600">Contingencias Comunes (4.7%)</span><span className="font-medium text-red-600">-{formatCurrency(calculations.contingenciasComunes)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Formación Profesional (0.1%)</span><span className="font-medium text-red-600">-{formatCurrency(calculations.formacionProfesional)}</span></div>
                      {isEventual && <div className="flex justify-between"><span className="text-slate-600">C.P. Desempleo (1.55%)</span><span className="font-medium text-red-600">-{formatCurrency(calculations.desempleo)}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-600">MEI (0.15%)</span><span className="font-medium text-red-600">-{formatCurrency(calculations.mei)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">I.R.P.F. ({irpf}%)</span><span className="font-medium text-red-600">-{formatCurrency(calculations.irpfDeduction)}</span></div>
                      {cuotaSindical > 0 && <div className="flex justify-between"><span className="text-slate-600">Cuota Sindical</span><span className="font-medium text-red-600">-{formatCurrency(cuotaSindical)}</span></div>}

                      <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold text-slate-800">
                        <span>Total Descuentos</span>
                        <span className="text-red-600">-{formatCurrency(calculations.totalDeducciones)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-slate-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Líquido a Percibir</span>
                        <span className="block text-xs text-slate-400 mt-1">Ingreso en cuenta</span>
                      </div>
                      <span className="text-3xl font-bold text-red-600">{formatCurrency(calculations.liquido)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between"><span>Base IRPF:</span> <span>{formatCurrency(calculations.baseIRPF)}</span></div>
                    <div className="flex justify-between"><span>Prorrateo Extra:</span> <span>{formatCurrency(calculations.prorrateoExtra)}</span></div>
                    <div className="flex justify-between"><span>Base Contingencias Comunes:</span> <span>{formatCurrency(calculations.baseCC)}</span></div>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <Calculator className="w-12 h-12 mb-4 opacity-20" />
                  <p>Seleccione una categoría profesional para ver el desglose de la nómina.</p>
                </div>
              )}
            </div>

            {/* <Chat /> */}
          </div>

        </div>

        <div className="mt-8 bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-sm flex gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <strong>Aviso importante:</strong> Esta aplicación es una herramienta orientativa e informativa desarrollada por <strong>UGT Servicios Públicos</strong>. Los cálculos e importes mostrados son estimaciones basadas en las instrucciones de nóminas vigentes y no tienen validez legal, oficial ni vinculante. Ante cualquier duda o discrepancia, consulta siempre tu recibo de nómina oficial o contacta con tu delegado sindical.
          </div>
        </div>
      </main>
    </div>
  );
}

