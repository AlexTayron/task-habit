import { gapi } from 'gapi-script';

const CLIENT_ID = '769094815842-5pnl8dbu5j2b79m8jqvbl5j4purjbbvb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB963B6qpZ1yB9Pvnte1EqlwsRD6i3IN0M'; // Chave de API atualizada
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"; // Pode ser necessário adicionar ou ajustar os escopos

// ID da agenda específica que o usuário deseja integrar
const TARGET_CALENDAR_ID = '32rvqhjnfrck2rfou52hdv92avkv5pm3@import.calendar.google.com';

export const initGoogleClient = () => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      }).then(() => {
        resolve(gapi);
      }).catch(reject);
    });
  });
};

export const signInWithGoogle = () => gapi.auth2.getAuthInstance().signIn();
export const signOutFromGoogle = () => gapi.auth2.getAuthInstance().signOut(); // Adicionar função de signOut
export const getIsSignedIn = () => gapi.auth2.getAuthInstance().isSignedIn.get();
export const getCurrentUser = () => gapi.auth2.getAuthInstance().currentUser.get();

export const createCalendarEvent = async (item) => {
  // Mapear dados do item (Tarefa/Hábito/To-Do) para o formato de evento do Google Calendar
  const event = {
    summary: item.título || item.nome || item.title, // Tentar diferentes campos para o título
    description: item.descrição || item.description || '',
    start: {
      // Usar data_inicial ou um campo de data apropriado do seu item
      dateTime: item.data_inicial ? new Date(item.data_inicial).toISOString() : (item.start ? new Date(item.start).toISOString() : new Date().toISOString()),
      timeZone: 'America/Sao_Paulo', // Ajuste o fuso horário
    },
    end: {
      // Usar data_final ou um campo de data apropriado do seu item
      dateTime: item.data_final ? new Date(item.data_final).toISOString() : (item.end ? new Date(item.end).toISOString() : new Date(new Date(item.data_inicial || item.start || new Date()).getTime() + 30 * 60000).toISOString()),
      timeZone: 'America/Sao_Paulo', // Ajuste o fuso horário
    },
    // TODO: Adicionar lógica para recorrência se o item for um Hábito
  };

  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: TARGET_CALENDAR_ID, // Usar o ID da agenda específica
      resource: event,
    });
    console.log('Evento criado no Google Calendar (agenda específica):', response.result);
    return { eventId: response.result.id, error: null };
  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar (agenda específica):', error);
    return { eventId: null, error: error.message };
  }
};

export const updateCalendarEvent = async (eventId, updatedItem) => {
  // Mapear dados do item atualizado (Tarefa/Hábito/To-Do) para o formato de evento do Google Calendar
  const event = {
    summary: updatedItem.título || updatedItem.nome || updatedItem.title,
    description: updatedItem.descrição || updatedItem.description || '',
    start: {
      dateTime: updatedItem.data_inicial ? new Date(updatedItem.data_inicial).toISOString() : (updatedItem.start ? new Date(updatedItem.start).toISOString() : undefined), // Usar undefined para não alterar se o campo não existir/for nulo
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: updatedItem.data_final ? new Date(updatedItem.data_final).toISOString() : (updatedItem.end ? new Date(updatedItem.end).toISOString() : undefined),
      timeZone: 'America/Sao_Paulo',
    },
    // TODO: Lidar com a lógica de recorrência se o item for um Hábito
  };

  // Remover campos undefined para evitar sobrescrever dados existentes no Calendar se não forem atualizados no app
  if (event.start && event.start.dateTime === undefined) delete event.start.dateTime;
  if (event.end && event.end.dateTime === undefined) delete event.end.dateTime;
  if (event.description === '') delete event.description; // Opcional: não enviar descrição vazia

  try {
    const response = await gapi.client.calendar.events.update({
      calendarId: TARGET_CALENDAR_ID, // Usar o ID da agenda específica
      eventId: eventId,
      resource: event,
    });
    console.log('Evento atualizado no Google Calendar (agenda específica):', response.result);
    return { error: null };
  } catch (error) {
    console.error('Erro ao atualizar evento no Google Calendar (agenda específica):', error);
    return { error: error.message };
  }
};

export const deleteCalendarEvent = async (eventId) => {
  try {
    const response = await gapi.client.calendar.events.delete({
      calendarId: TARGET_CALENDAR_ID, // Usar o ID da agenda específica
      eventId: eventId,
    });
    console.log('Evento excluído no Google Calendar (agenda específica):', response.result);
    return { error: null };
  } catch (error) {
    console.error('Erro ao excluir evento no Google Calendar (agenda específica):', error);
    // Não lançar erro aqui para não impedir a exclusão local
    return { error: error.message };
  }
};

export const fetchCalendarEvents = async (timeMin, timeMax) => {
  if (!gapi || !gapi.client || !gapi.client.calendar) {
    console.error('Cliente Google Calendar não carregado ou não autenticado.');
    return { events: null, error: 'Cliente Google Calendar não carregado ou não autenticado.' };
  }

  try {
    console.log('Buscando eventos do Google Calendar (agenda específica)...', { timeMin, timeMax });
    const response = await gapi.client.calendar.events.list({
      calendarId: TARGET_CALENDAR_ID, // Usar o ID da agenda específica
      timeMin: timeMin.toISOString(), // Data/hora mínima (ISO 8601)
      timeMax: timeMax.toISOString(), // Data/hora máxima (ISO 8601)
      singleEvents: true, // Expandir eventos recorrentes em instâncias únicas
      orderBy: 'startTime', // Ordenar por data/hora de início
    });
    const events = response.result.items;
    console.log('Eventos encontrados no Google Calendar (agenda específica):', events);
    return { events: events, error: null };
  } catch (error) {
    console.error('Erro ao buscar eventos do Google Calendar (agenda específica):', error);
    return { events: null, error: error.message };
  }
};

// TODO: Adicionar função para lidar com a autorização/login caso o cliente não esteja autenticado
// TODO: Lógica mais robusta para sincronização bidirecional e tratamento de duplicatas/conflitos

export default gapi; 