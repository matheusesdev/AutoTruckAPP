import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { agendamentoService } from '../services/api';
import { theme } from '../utils/theme';

// Configuração do calendário para PT-BR
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

const EditarAgendamentoScreen = ({ route, navigation }) => {
  const { servico } = route.params;

  const [novaData, setNovaData] = useState('');
  const [novoHorario, setNovoHorario] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [marcadasNoCalendario, setMarcadasNoCalendario] = useState({});
  const [loading, setLoading] = useState(false);
  const [carregandoCalendario, setCarregandoCalendario] = useState(true);
  const [showModalHorarios, setShowModalHorarios] = useState(false);

  const hoje = new Date();
  const dataMinima = new Date(hoje.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Formatar data para exibição
  const formatarDataCompleta = (dataString) => {
    const data = new Date(dataString);
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${data.toLocaleDateString('pt-BR', opcoes)} às ${hora}`;
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Carregar datas disponíveis ao montar
  useEffect(() => {
    carregarDatasDisponiveis();
  }, []);

  const carregarDatasDisponiveis = async () => {
    setCarregandoCalendario(true);
    try {
      const response = await agendamentoService.obterDatasDisponiveis();
      
      // Estruturar marcações para o calendário
      const marcacoes = {};
      
      if (response.disponibilidades && Array.isArray(response.disponibilidades)) {
        response.disponibilidades.forEach((data) => {
          marcacoes[data] = {
            selected: false,
            marked: true,
            selectedColor: theme.colors.primary,
            selectedTextColor: '#fff',
            disabled: false,
            disableTouchEvent: false,
            dotColor: theme.colors.success,
            marked: true,
          };
        });
      }

      // Se vier um objeto com datas como chaves
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        Object.keys(response).forEach((data) => {
          if (response[data] === true || response[data]?.disponivel === true) {
            marcacoes[data] = {
              selected: false,
              marked: true,
              selectedColor: theme.colors.primary,
              selectedTextColor: '#fff',
              disabled: false,
              disableTouchEvent: false,
              dotColor: theme.colors.success,
            };
          }
        });
      }

      setMarcadasNoCalendario(marcacoes);
    } catch (error) {
      console.error('Erro ao carregar datas disponíveis:', error);
      Alert.alert('Aviso', 'Não foi possível carregar as datas disponíveis. Tente novamente.');
    } finally {
      setCarregandoCalendario(false);
    }
  };

  const handleDataSelecionada = async (day) => {
    // Verificar se a data está disponível
    if (!marcadasNoCalendario[day.dateString]) {
      Alert.alert('Data Indisponível', 'Selecione uma data com disponibilidade.');
      return;
    }

    setNovaData(day.dateString);
    setNovoHorario(''); // Limpar horário anterior
    carregarHorarios(day.dateString);
    setShowModalHorarios(true);
  };

  const carregarHorarios = async (data) => {
    try {
      const horarios = await agendamentoService.getHorariosDisponiveis(data);
      setHorariosDisponiveis(horarios || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setHorariosDisponiveis([]);
    }
  };

  const confirmarReagendamento = async () => {
    if (!novaData) {
      Alert.alert('Atenção', 'Selecione uma nova data.');
      return;
    }

    if (!novoHorario) {
      Alert.alert('Atenção', 'Selecione um novo horário.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        data_agendada: `${novaData}T${novoHorario}:00Z`,
      };

      await agendamentoService.reagendarAgendamento(servico.id, payload);

      Alert.alert('Sucesso', 'Agendamento reagendado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Erro', error || 'Erro ao reagendar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados do calendário
  const markedDates = {
    ...marcadasNoCalendario,
    ...(novaData && {
      [novaData]: {
        selected: true,
        marked: true,
        selectedColor: theme.colors.accent,
        selectedTextColor: '#fff',
      },
    }),
  };

  return (
    <ScrollView style={styles.container}>
      {/* Seção do Agendamento Atual */}
      <View style={styles.secaoAtual}>
        <Text style={styles.titulo}>Agendamento Atual</Text>
        
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Serviço:</Text>
            <Text style={styles.valor}>{servico.tipo_servico}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Data e Horário:</Text>
            <Text style={styles.valorData}>{formatarDataCompleta(servico.data_agendada)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Veículo:</Text>
            <Text style={styles.valor}>ID {servico.veiculo_id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(servico.status).bg }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(servico.status).txt }]}>
                {servico.status}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Seção do Calendário */}
      <View style={styles.secaoCalendario}>
        <Text style={styles.titulo}>Selecione Nova Data</Text>

        {carregandoCalendario ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando disponibilidades...</Text>
          </View>
        ) : (
          <>
            <Calendar
              minDate={dataMinima}
              onDayPress={handleDataSelecionada}
              markedDates={markedDates}
              markingType="custom"
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: theme.colors.accent,
                dayTextColor: theme.colors.text,
                textDisabledColor: '#d9d9d9',
                dotColor: theme.colors.accent,
                selectedDotColor: '#ffffff',
                monthTextColor: theme.colors.primary,
                indicatorColor: theme.colors.accent,
                textDayFontFamily: 'System',
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
            />

            <View style={styles.legendaContainer}>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.legendaTexto}>Disponível</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: '#d9d9d9' }]} />
                <Text style={styles.legendaTexto}>Indisponível</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Seção da Data e Horário Selecionados */}
      {novaData && (
        <View style={styles.secaoSelecionado}>
          <Text style={styles.titulo}>Novo Agendamento</Text>
          
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nova Data:</Text>
              <Text style={styles.valor}>{formatarData(novaData)}</Text>
            </View>

            {novoHorario && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Novo Horário:</Text>
                  <Text style={styles.valor}>{novoHorario}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Botões de Ação */}
      <View style={styles.botoes}>
        <TouchableOpacity
          style={[
            styles.btnConfirmar,
            (!novaData || !novoHorario || loading) && styles.btnDesabilitado,
          ]}
          onPress={confirmarReagendamento}
          disabled={!novaData || !novoHorario || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnTexto}>Confirmar Reagendamento</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCancelar} onPress={() => navigation.goBack()}>
          <Text style={styles.btnCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Horários */}
      <Modal
        visible={showModalHorarios}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModalHorarios(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Selecione um Horário</Text>
              <TouchableOpacity
                onPress={() => setShowModalHorarios(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {horariosDisponiveis.length === 0 ? (
              <View style={styles.modalVazio}>
                <Text style={styles.modalVazioTexto}>Nenhum horário disponível para esta data.</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                {horariosDisponiveis.map((horario) => (
                  <TouchableOpacity
                    key={horario}
                    style={[
                      styles.horarioItem,
                      novoHorario === horario && styles.horarioItemSelecionado,
                    ]}
                    onPress={() => {
                      setNovoHorario(horario);
                      setShowModalHorarios(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.horarioTexto,
                        novoHorario === horario && styles.horarioTextoSelecionado,
                      ]}
                    >
                      {horario}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalBtnFechar}
              onPress={() => setShowModalHorarios(false)}
            >
              <Text style={styles.modalBtnFecharTexto}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Função auxiliar para obter cores de status
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'agendado':
      return { bg: '#e3f2fd', txt: '#0d47a1' };
    case 'em analise':
    case 'em análise':
      return { bg: '#fff3e0', txt: '#e65100' };
    case 'em manutencao':
    case 'em manutenção':
      return { bg: '#fffde7', txt: '#fbc02d' };
    case 'finalizado':
      return { bg: '#e8f5e9', txt: '#1b5e20' };
    case 'cancelado':
      return { bg: '#ffebee', txt: '#b71c1c' };
    default:
      return { bg: '#f5f5f5', txt: '#333333' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Seções
  secaoAtual: {
    backgroundColor: '#fff',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadow.sm,
  },

  secaoCalendario: {
    backgroundColor: '#fff',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadow.sm,
  },

  secaoSelecionado: {
    backgroundColor: '#f0f8ff',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },

  // Título
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },

  // Info Box
  infoBox: {
    backgroundColor: '#fafafa',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },

  valor: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },

  valorData: {
    fontSize: 14,
    color: theme.colors.accent,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: theme.spacing.sm,
  },

  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Calendário
  centerLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  loadingText: {
    marginTopTop: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 14,
  },

  legendaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.lg,
  },

  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  legendaDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  legendaTexto: {
    fontSize: 12,
    color: theme.colors.text,
  },

  // Botões
  botoes: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  btnConfirmar: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.sm,
  },

  btnDesabilitado: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.6,
  },

  btnTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  btnCancelar: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  btnCancelarTexto: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalConteudo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '80%',
    paddingTop: theme.spacing.md,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  modalClose: {
    padding: theme.spacing.sm,
  },

  modalCloseText: {
    fontSize: 20,
    color: theme.colors.text,
  },

  modalScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },

  modalVazio: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  modalVazioTexto: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  horarioItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  horarioItemSelecionado: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  horarioTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },

  horarioTextoSelecionado: {
    color: '#fff',
  },

  modalBtnFechar: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },

  modalBtnFecharTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditarAgendamentoScreen;
