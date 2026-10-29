var COOKIE_LIST_FOR = 'FORNITURE_PREFERITE';
var COOKIE_LAST_FOR = 'ULTIMA_FORNITURA';
var LIMITE_NUMERO_FORNITURE = 5;
var mese_limit_sx = 13;
var mese_limit_dx = 2;

function getFornitureElettrico() {
    return $.ajax({
    	url: context+'/api/rs/it/fornitureElettricheService.json'
    });
};

function getFornitureGas() {
    return $.ajax({
    	url: context+'/api/rs/it/fornitureGasService.json'
    });
};

function selezionaFornitura(codice, commodity){
	if(commodity == 'E'){
		changeTipoOfferta('energiaElettrica', codice);
	}else if(commodity == 'G'){
		changeTipoOfferta('gas', codice);
	}else{
		document.location = confrontaOffertePageUrl;
	}
};

function popolaFiltriElettrico(fornitura){
	//Set comune
	var comune = fornitura[0].comune;
	$('input[name="capComuneDescr"]').val(comune);
	
	//Chiamo il servizio geoService per recuperare il codice istat del comune
    $.ajax({
    	url: context+"/api/rs/it/portal/geoService.json?cap-comune="+comune
    }).done(function (data) {
    	var items = data.response.result.services.item;
    	if(items instanceof Array && items.length > 0){
    		var codIstat = items.find(x => x.denominazione.toUpperCase() === comune.toUpperCase()).codIstat;
    		$('input[name="codiceIstatComune"]').val(codIstat);
    	}else{
    		$('input[name="codiceIstatComune"]').val(items.codIstat);
    	}
    }).fail(function(xhr, status, error) {
    	console.log('Error calling getCodiceIstatComune');
    });
	
	//Tipo offerta
	if(fornitura[0].tariffa.toUpperCase().includes(utenza_domestico.toUpperCase())){
		checkInputForm('casa', 'casa');
	}else{
		checkInputForm('attivita', 'attivita');
		if(fornitura[0].tipo_tutela.toUpperCase() == salvaguardia.toUpperCase()){
    		$('#maggiorTutela').val('SALVAGUARDIA');
		}else if(fornitura[0].tipo_tutela.toUpperCase().includes(tutele_graduali) && fornitura[0].tipo_tutela.toUpperCase() != tutele_graduali_domestici.toUpperCase()){
    		$('#maggiorTutela').val('TUTELE_GRADUALI');
		};
				
	};
	
	//Gestione ubicazione
	cambiaUbicazioneEE();	
	
	//Offerta confronto
	$("#CodiceOfferta").prop('disabled',false);
	
	//Residente
	if(fornitura[0].residente.toUpperCase() == 'Y'){
		checkInputForm('residenteSI', 'residenteSI');
	}else if(fornitura[0].residente.toUpperCase() == 'N'){
		checkInputForm('residenteNO', 'residenteNO');
	};
	
	//Potenza impegnata
	if(fornitura[0].potenza_impegnata != null && fornitura[0].potenza_impegnata != ''){
		fillPotenzaImpegnata(fornitura[0].potenza_impegnata);		
	}
	
    //Vulnerabilità
	if(fornitura[0].cliente_vulnerabile.toUpperCase() == 'Y'){
		$('#scegliVulnerabile').val('SI');
	}else if(fornitura[0].cliente_vulnerabile.toUpperCase() == 'N'){
		$('#scegliVulnerabile').val('NO');		
	}
	
	//Trattamento
	fillTrattamento(fornitura[0].trattamento, trattamento_mono_label);
};

function popolaFiltriGas(fornitura){
	//Set comune
	var comune = fornitura[0].comune;
	$('input[name="capComuneDescr"]').val(comune);
	
	//Chiamo il servizio geoService per recuperare il codice istat del comune
    $.ajax({
    	url: context+"/api/rs/it/portal/geoService.json?cap-comune="+comune
    }).done(function (data) {
    	var items = data.response.result.services.item;
    	if($.isArray(items) && items.length > 0){
    		var codIstat = items.find(x => x.denominazione.toUpperCase() === comune.toUpperCase()).codIstat;
    		$('input[name="codiceIstatComune"]').val(codIstat);
    	}else{
    		$('input[name="codiceIstatComune"]').val(items.codIstat);
    	}
    }).fail(function(xhr, status, error) {
    	console.log('Error calling getCodiceIstatComune');
    });
    
    //Tipo PDR
	if(fornitura[0].tipo_pdr.toUpperCase() == pdr_domestico.toUpperCase()){
		checkInputForm('casa','casa');
	}else if(fornitura[0].tipo_pdr.toUpperCase().includes(pdr_condominio.toUpperCase())){
		checkInputForm('Condominio','Condominio');
	}else if(fornitura[0].tipo_pdr != ''){
		checkInputForm('altriUsi','altriUsi');
	}
	radioSelection('dove')
	cambiaUbicazioneGAS();
	
	//Offerta confronto
	$("#CodiceOfferta").prop('disabled',false);
	
    //Vulnerabilità
	if(fornitura[0].cliente_vulnerabile.toUpperCase() == 'Y'){
		$('#scegliVulnerabile').val('SI');
	}else if(fornitura[0].cliente_vulnerabile.toUpperCase() == 'N'){
		$('#scegliVulnerabile').val('NO');		
	}
	
	//Categoria uso
	if(fornitura[0].categoria_uso.toUpperCase().includes(cat_uso_riscaldamento.toUpperCase())){
		$("label[for='riscaldamento']").trigger('click');
		$("label[for='riscaldamentoAltro']").trigger('click');
	}
	if(fornitura[0].categoria_uso.toUpperCase().includes(cat_uso_acqua.toUpperCase())){
		$("label[for='acquaCalda']").trigger('click');
	}
	if(fornitura[0].categoria_uso.toUpperCase().includes(cat_uso_cibi.toUpperCase())){
		$("label[for='cottura']").trigger('click');
	}
	if(fornitura[0].categoria_uso.toUpperCase().includes(cat_uso_tech.toUpperCase())){
		$("label[for='usoTec']").trigger('click');
	}
	
	//Classe contatore
	var classe_contatore = fornitura[0].classe_misuratore;
	if(classe_contatore){
		classe_contatore = classe_contatore.replace('G','');
		if(classe_contatore >= 1.6 && classe_contatore <= 6){
			$('#scegliClasse').val('1');
		}else if(classe_contatore >= 10 && classe_contatore <= 40){
			$('#scegliClasse').val('2');
		}else if(classe_contatore >= 65){
			$('#scegliClasse').val('3');
		}
	}

};

function checkInputForm(id, _for){
	$('#'+id).prop( "checked", true );
	$('label[for="'+_for+'"]').removeClass("transitionLabel");
	$('label[for="'+_for+'"]').addClass("sel");
	$('label[for="'+_for+'"]').next('div').addClass('checkImg');
}

function resetInputForm(id, _for){
	$('#'+id).prop( "checked", false );
	$('label[for="'+_for+'"]').addClass("transitionLabel");
	$('label[for="'+_for+'"]').removeClass("sel");
	$('label[for="'+_for+'"]').next('div').removeClass('checkImg');
}

function fillPotenzaImpegnata(potenza){
	//Decodifico i valori per gestire il caso "Altro"
	var default_value = [1.5,3,4.5,6,10,15];
	if(default_value.includes(potenza)){
		$('#scegliPotenza').val(potenza);
	}else{
		$('#scegliPotenza').val('Altro');  
		$('#altroValore').val(potenza);  
		$('#wrapperAltroValore').removeClass('hidden');
	}
}

function fillTrattamento(trattamento, trattamento_mono_label){
	if(trattamento.toUpperCase() == trattamento_mono_label.toUpperCase()){
		$('#tipoTariffa').val('monoraria');  
		conosciConsumo();
	}
}

function getMisureMensili12Mesi(big_data, commodity){
	//Se non ci sono misure restituisco un array vuoto
	if(big_data == null){
		return [];
	}
	
	//ciclo tutte le forniture
	//creo un array di tutte le misure mensili e giornaliere
	var misure_mensili_all = [];
	$.each(big_data, function( key, value ) {
		if(value.misure[0].misure_mensili){
			$.merge(misure_mensili_all,value.misure[0].misure_mensili);
		}
	});
	
	//A partire dal mese corrente cerco le misure da N-12 a N-1 e le metto in un altro array
	const format = "YYYYMM";
	const limit = mese_limit_sx;
	var mensili_ultimi_12_mesi = [];
	//Vado indietro di 2 mesi per individuare il mese di riferimento da cui partire
	var mount_ref = moment().subtract(mese_limit_dx, 'M');
	for(i = limit; i > 1; i--){
		mount_tmp = mount_ref;
		var result;
		if(commodity == 'energiaElettrica'){
			result = misure_mensili_all.find(item => item.competenza_consumi === mount_tmp.format(format) && (item.delta_misure_f1 != null || item.delta_misure_monoraria != null) );
		}else if(commodity == 'gas'){
			result = misure_mensili_all.find(item => item.competenza_consumi === mount_tmp.format(format) && item.delta_misure != null );
		}
		if(result){
			mensili_ultimi_12_mesi.push(result);
		}
		//Sottraggo un mese
		mount_ref = mount_ref.subtract(1, 'M');
	}
	return mensili_ultimi_12_mesi;
}

function distribuisciConsumiPerFasceStandard(misure, commodity){
	if(commodity == 'energiaElettrica'){
		var domestico =  $('input[name="dove"]:checked').val() == 'casa';
		$.each(misure, function( key, value ) {
			var tot = value.delta_misure_f1 + value.delta_misure_f2 + value.delta_misure_f3 + value.delta_misure_f4 + value.delta_misure_f5 + value.delta_misure_f6;
			value.delta_misure_f1 = 0;
			value.delta_misure_f2 = 0;
			value.delta_misure_f3 = 0;
			if(domestico){
				value.delta_misure_f1 = Number((tot * distribuzDomestico.F1).toFixed(2));
				value.delta_misure_f2 = Number((tot * distribuzDomestico.F2).toFixed(2));
				value.delta_misure_f3 = Number((tot - value.delta_misure_f1 - value.delta_misure_f2).toFixed(2));
			}else{
				value.delta_misure_f1 = Number((tot * distribuzNonDomestico.F1).toFixed(2));
				value.delta_misure_f2 = Number((tot * distribuzNonDomestico.F2).toFixed(2));
				value.delta_misure_f3 = Number((tot - value.delta_misure_f1 - value.delta_misure_f2).toFixed(2));
			}
			//Azzero le altre fasce
			value.delta_misure_f4 = null;
			value.delta_misure_f5 = null;
			value.delta_misure_f6 = null;
		});
		return misure;		
	}else{
		return misure;
	}
}

function getMisureGiornaliere12Mesi(big_data, commodity){
	//Se non ci sono misure restituisco un array vuoto
	if(big_data == null){
		return [];
	}
	
	var misure_giornaliere_all = [];
	$.each(big_data, function( key, value ) {
		if(commodity == 'energiaElettrica'){
			if(misure_giornaliere_all,value.misure[0].misure_orarie){
				$.merge(misure_giornaliere_all,value.misure[0].misure_orarie);			
			}			
		}else if(commodity == 'gas'){
			if(misure_giornaliere_all,value.misure[0].misure_giornaliere){
				$.merge(misure_giornaliere_all,value.misure[0].misure_giornaliere);			
			}			
		}
	});
	
	//A partire dal mese corrente cerco le misure da N-12 a N-1 e le metto in un altro array
	const format = "YYYYMM";
	const limit = mese_limit_sx;
	var giornalieri_ultimi_12_mesi = [];
	//Vado indietro di 2 mesi per individuare il mese di riferimento da cui partire
	var mount_ref = moment().subtract(mese_limit_dx, 'M');
	for(i = limit; i > 1; i--){
		mount_tmp = mount_ref;
		var result;
		if(commodity == 'energiaElettrica'){
			result = misure_giornaliere_all.filter(item => item.competenza_consumi === mount_tmp.format(format) && (item.delta_misure_f1 != null || item.delta_misure_monoraria != null) );
		}else if(commodity == 'gas'){
			result = misure_giornaliere_all.filter(item => item.competenza_consumi === mount_tmp.format(format) && item.delta_misure != null );
		}
		if(result){
			$.each(result, function( key, value ) {
				giornalieri_ultimi_12_mesi.push(value);
			});
		}
		//Sottraggo un mese
		mount_ref = mount_ref.subtract(1, 'M');
	}
	return giornalieri_ultimi_12_mesi;
}

function getStatoMisure(mensili, giornaliere){
	console.log('Soglia giornalieri:'+soglia_giornalieri);
	const format = "YYYYMM";
	var stato = 0;
	const mese_sx = moment().subtract(mese_limit_sx, 'M').format(format);
 	const mese_dx = moment().subtract(mese_limit_dx, 'M').format(format);
	var test_sx = mensili.find(item => item.competenza_consumi === mese_sx);
	var test_dx = mensili.find(item => item.competenza_consumi === mese_dx); 	
 	
	// Stato 1 - Mese N-12 e/o mese N-1 assente 
	if(typeof test_sx === 'undefined' || typeof test_dx === 'undefined'){
		stato = 1;
	}

	// Stato 2 - Mese N-12 e mese N-1 presenti, uno o più dei 12 valori sono assenti 
	if(stato != 1 && mensili.length < 12 ){
		stato = 2;
	}
	
	console.log('N* misure giornaliere:'+giornaliere.length);
	// Stato 3 - Mese N-12 e mese N-1 presenti, 12 valori mensili presenti, giornalieri assenti o inferiori alla soglia configurata
	if(stato != 1 && stato != 2 && (giornaliere.length == 0 || giornaliere.length < soglia_giornalieri) ){
		stato = 3;
	}
	
	// Stato 4 - Mese N-12 e mese N-1 presenti, 12 valori mensili presenti, giornalieri superiori alla soglia configurata
	if(stato != 1 && stato != 2 && giornaliere.length >= soglia_giornalieri){
		stato = 4;
	}
	console.log('STATO MISURE:'+stato);	
	return stato;
}

function changeUsaConsumi(value){
	$('#fieldsetConsumoAnnuo').hide();
	$('#fieldsetStimaConsumi').hide();
	$('#fieldsetStimaConsumoGas').hide();
	
	//Faccio il reset dei campi consumo fasce/mono
	$('#consumoFasce').find('input').val('');
	$('#consumoSingolo').find('input').val('');
	
	if(value == 'SI'){
		$('#fieldsetConsumoRecuperato').show();
		$('.fieldsetConosci').hide();
		$('#fieldsetConsumoAnnuoGas').hide();
	}else if(value == 'NO'){
		$('#fieldsetConsumoRecuperato').hide();
		var tipoCliente = $('input[name="dove"]:checked').val();
		if(tipoCliente == 'casa'){
			$('.fieldsetConosci').show();
			resetInputForm('consumoSI','consumoSI');
			resetInputForm('consumoNO','consumoNO');
			resetInputForm('consumoGasSI','consumoGasSI');
			resetInputForm('consumoGasNO','consumoGasNO');
		}else{
			checkInputForm('consumoSI','consumoSI');
			conosciConsumo();
			$('#fieldsetConsumoAnnuoGas').show();
		}
	}
}

//Il JSON da passare al BE è diverso da quello costruito lato FE
//bisogna eliminare alcune proprietà non utili e rinominarne altre
function normalizzaMensili(mensili, commodity){
	if(commodity == 'energiaElettrica'){
		$.each(mensili, function( key, value ) {
			delete value.potf1;
			delete value.potf2;
			delete value.potf3;
			delete value.potm;
			delete value.tipo_misura;	
			delete value.data_lettura;	
			delete value.lettura_misura_f1;	
			delete value.lettura_misura_f2;	
			delete value.lettura_misura_f3;	
			delete value.lettura_misura_f4;	
			delete value.lettura_misura_f5;	
			delete value.lettura_misura_f6;	
			delete value.lettura_misura_monoraria;		
			value.delta_misure_gas = null;		
		});		
	}else if(commodity == 'gas'){
		$.each(mensili, function( key, value ) {
			delete value.tipo_misura;	
			delete value.lettura_mese;	
			delete value.data_lettura;	
			value.delta_misure_f1 = null;		
			value.delta_misure_f2 = null;		
			value.delta_misure_f3 = null;		
			value.delta_misure_f4 = null;		
			value.delta_misure_f5 = null;		
			value.delta_misure_f6 = null;		
			value.delta_misure_monoraria = null;
			value.delta_misure_gas = value.delta_misure;
			delete value.delta_misure;	
		});		
	}
	return mensili;
}

//Il JSON da passare al BE è diverso da quello costruito lato FE
//bisogna eliminare alcune proprietà non utili e rinominarne altre
function normalizzaGiornalieri(giornalieri, commodity){
	if(commodity == 'energiaElettrica'){
		$.each(giornalieri, function( key, value ) {
			delete value.potenza_max_erogata;
			delete value.tipo_misura;	
			delete value.data_lettura;	
			delete value.lettura_misura_f1;	
			delete value.lettura_misura_f2;	
			delete value.lettura_misura_f3;	
			delete value.lettura_misura_f4;	
			delete value.lettura_misura_f5;	
			delete value.lettura_misura_f6;	
			delete value.lettura_misura_monoraria;		
			value.competenza_consumi = value.giorno;
			value.delta_misure_monoraria = value.consumo_giornaliero_gg;
			delete value.consumo_giornaliero_gg;
			delete value.giorno;
		});		
	}
	return giornalieri;
}

function creaObjConsumoTotale(mensili, commodity){
	var consumi =  {
		"consF0": null,
	    "consF1": null,
	    "consF2": null,
	    "consF3": null,
	    "consF4": null,
	    "consF5": null,
	    "consF6": null,
	    "consF12": null,
	    "consF13": null,
	    "consF23": null
	  }
	
	if(commodity == 'energiaElettrica'){
		consumi.consF0 = 0;
		consumi.consF1 = 0;
		consumi.consF2 = 0;
		consumi.consF3 = 0;
		consumi.consF4 = 0;
		consumi.consF5 = 0;
		consumi.consF6 = 0;
		$.each(mensili, function( key, value ) {
			if(value.delta_misure_f1 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f1;
				consumi.consF1 = consumi.consF1 + value.delta_misure_f1;
			}
			if(value.delta_misure_f2 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f2;
				consumi.consF2 = consumi.consF2 + value.delta_misure_f2;
			}
			if(value.delta_misure_f3 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f3;
				consumi.consF3 = consumi.consF3 + value.delta_misure_f3;
			}
			if(value.delta_misure_f4 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f4;
				consumi.consF4 = consumi.consF4 + value.delta_misure_f4;
			}
			if(value.delta_misure_f5 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f5;
				consumi.consF5 = consumi.consF5 + value.delta_misure_f5;
			}
			if(value.delta_misure_f6 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f6;
				consumi.consF6 = consumi.consF6 + value.delta_misure_f6;
			}
			if(value.delta_misure_f12 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f12;
				consumi.consF12 = consumi.consF12 + value.delta_misure_f12;
			}
			if(value.delta_misure_f13 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f13;
				consumi.consF13 = consumi.consF13 + value.delta_misure_f13;
			}			
			if(value.delta_misure_f23 != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_f23;
				consumi.consF23 = consumi.consF23 + value.delta_misure_f23;
			}
			if(value.delta_misure_monoraria != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure_monoraria;
			}
		});
		consumi.consF0 = consumi.consF0.toFixed(0);
		consumi.consF1 = consumi.consF1.toFixed(0);
		consumi.consF2 = consumi.consF2.toFixed(0);
		consumi.consF3 = consumi.consF3.toFixed(0);
		consumi.consF4 = consumi.consF4.toFixed(0);
		consumi.consF5 = consumi.consF5.toFixed(0);
		consumi.consF6 = consumi.consF6.toFixed(0);
	}else if(commodity == 'gas'){
		consumi.consF0 = 0;
		$.each(mensili, function( key, value ) {
			if(value.delta_misure != null){
				consumi.consF0 = consumi.consF0 + value.delta_misure;
			}
		});
		consumi.consF0 = consumi.consF0.toFixed(0);
	}

	return consumi;
}

function ripartizioneFasceConsumoTotale(consumi){
	//Prendo il totale annnuo e lo ripartisco nelle fasce F1, F2, F3 in base alla conf. standard
	var totale = consumi.consF0;	
	var domestico =  $('input[name="dove"]:checked').val() == 'casa';
	consumi.consF1 = 0;
	consumi.consF2 = 0;
	consumi.consF3 = 0;

	if(domestico){
		consumi.consF1 = totale * distribuzDomestico.F1;
		consumi.consF2 = totale * distribuzDomestico.F2;
		consumi.consF3 = totale - consumi.consF1 - consumi.consF2;
	}else {
		consumi.consF1 = totale * distribuzNonDomestico.F1;
		consumi.consF2 = totale * distribuzNonDomestico.F2;
		consumi.consF3 = totale - consumi.consF1 - consumi.consF2;
	}
	
	//Azzero le altre fasce
	consumi.consF4 = null;
	consumi.consF5 = null;
	consumi.consF6 = null;
	
	return consumi;
}

function getStatoConfFasce(fornitura){
	var stato = 0;
	//STATO 0 - No fasce configurate
	//STATO 1 - Una configurazione prima degli ultimi 12 mesi
	//STATO 2 - Una configurazione negli ultimi 12 mesi
	//STATO 3 - Più configurazioni e l'ulitma prima degli ultimi 12 mesi
	//STATO 4 - Più configurazioni e l'ultima negli ultimi 12 mesi
	if(fornitura.configurazione_fasce && fornitura.configurazione_fasce.length > 0 ){
		const mese_n_12 = moment().subtract(12, 'M');
	 	const mese_n_1 = moment().subtract(1, 'M');
		if(fornitura.configurazione_fasce.length == 1){
			//STATO 1 - 2
			const data_inizio = moment(fornitura.configurazione_fasce[0].Data_Inizio_Configurazione);
			if(data_inizio.isBefore(mese_n_12,'month')){
				stato = 1;
			}else if(data_inizio.isAfter(mese_n_12,'month')){
				stato = 2;
			}
		}else if(fornitura.configurazione_fasce.length > 1){
			//STATO 3 - 4
			//Prendo l'ultima configurazione (quella con Data_Fine_Configurazione valorizzata)
			var ultima_conf = fornitura.configurazione_fasce.find(item => item.Data_Fine_Configurazione == "" || item.Data_Fine_Configurazione == null);	
			if(ultima_conf){
				const data_inizio = moment(ultima_conf.Data_Inizio_Configurazione);
				if(data_inizio.isBefore(mese_n_12,'month')){
					stato = 3;
				}else if(data_inizio.isAfter(mese_n_12,'month')){
					stato = 4;
				}				
			}
		}
	}
	console.log('STATO FASCE:'+stato);
	return stato;
}

function visualizzaFornitura(cod_fornitura, commodity){

	fillDettaglioFornitura(cod_fornitura);
	if(commodity == 'E'){
		$('.onlyElettrico').removeClass('hidden');
		$('.onlyGas').addClass('hidden');
	}else if(commodity == 'G'){
		$('.onlyElettrico').addClass('hidden');
		$('.onlyGas').removeClass('hidden');
	}
	
	// Seleziono la fornitura corrente dalla lista
	var html_sel = creaHtmlFornituraSelezionata(fornitura);
	$('#btn_cerca_forniture').html('').html(html_sel);
	
	//Creazione cookie ULTIMA_FORNITURA_VISUALIZZATA
	setCookie(COOKIE_LAST_FOR, cod_fornitura , 30);
	
	//Controllo forniture preferite
	preferitiCtrl();
	
	$('.target_forniture').show();
}

function fillDettaglioFornitura(cod_fornitura){
	var anag = {};

	var fornitura_arr = $.grep(lista_pod_pdr, function(v) {
	    return v.codice_fornitura === cod_fornitura;
	});

	//Valorizzo la variabile globale della fornitura selezionata
	fornitura = fornitura_arr[0];
	
	if(fornitura.commodity == 'G'){
		anag = anagrafica_g;
	}else if(fornitura.commodity == 'E'){
		anag = anagrafica_e;
		
		//Visualizzo il link della conf fasce solamente se trattamento è "da contratto" o "regolate da arera"
		if(fornitura.trattamento.toUpperCase() == 'REGOLATE DA ARERA'){	
			$('.link_conf_fasce').show();
		}else if (fornitura.trattamento.toUpperCase() == 'DA CONTRATTO'){
			//Se non ci sono configurazioni nascondo il link
			if(typeof fornitura.configurazione_fasce !== 'undefined' && fornitura.configurazione_fasce.length > 0){
				$('.link_conf_fasce').show();
			}else{
				$('.link_conf_fasce').hide();					
			}
		}else{
			$('.link_conf_fasce').hide();	
		}
		
	}

	$('#codice_pod').html('').html(fornitura.codice_pod_pdr);
	$('#codice_pdr').html('').html(fornitura.codice_pod_pdr);

	if(anag.codice_fiscale != null && anag.codice_fiscale != ''){
		$('#p_iva_cc').html('').html(anag.codice_fiscale+'&nbsp;');	
	}else if(anag.p_iva != null && anag.p_iva != ''){
		$('#p_iva_cc').html('').html(anag.p_iva+'&nbsp;');		
	}
	
	if(anag.ragione_sociale != null && anag.ragione_sociale != '' && anag.ragione_sociale != '--'){
		$('#nominativo_rag_sociale').html('').html(anag.ragione_sociale+'&nbsp;');		
	}else{
		$('#nominativo_rag_sociale').html('').html(anag.cognome+' '+anag.nome+'&nbsp;');	
	}

	
	$('#indirizzo').html('').html(fornitura.toponimo_Indirizzo+' '+fornitura.nome_strada+' '+fornitura.civico+', '+fornitura.cap+' '+fornitura.comune+', '+fornitura.provincia);	
	$('#ragione_sociale_cc_e').html('').html(fornitura.ragione_sociale_cc+'&nbsp;');
	$('#codice_offerta').html('').html(fornitura.codice_offerta+'&nbsp;');
	$('#ragione_sociale_cc_g').html('').html(fornitura.ragione_sociale_cc+'&nbsp;');
	$('#tipo_cliente').html('').html(fornitura.tariffa+'&nbsp;');	
	$('#tipo_mercato').html('').html(fornitura.tipo_mercato+'&nbsp;');
	
	if(fornitura.tensione != null && fornitura.tensione != '--'){
		$('#tensione').html('').html(fornitura.tensione+'&nbsp;V');	
	}else{
		$('#tensione').html('').html('--');	
	}
	
	$('#tipo_misuratore').html('').html(fornitura.tipo_misuratore+'&nbsp;');	
	$('#ragione_sociale_distributore').html('').html(fornitura.ragione_sociale_distributore+'&nbsp;');
		
	if(fornitura.data_fine_fornitura != null && fornitura.data_fine_fornitura != '' && fornitura.data_fine_fornitura != '--'){
		$('#fine_ultima_fornitura').html('').html(formattaData(fornitura.data_fine_fornitura)+'&nbsp;');
	}else{
		$('#fine_ultima_fornitura').html('').html('--');
	}
	
	$('#distributore_e').html('').html(fornitura.ragione_sociale_distributore+'&nbsp;');
	$('#distributore_g').html('').html(fornitura.ragione_sociale_distributore+'&nbsp;');
	
	if(fornitura.potenza_impegnata != null && fornitura.potenza_impegnata != '--'){
		$('#potenza_impiegata').html('').html(fornitura.potenza_impegnata+'&nbsp;KW');
	}else{
		$('#potenza_impiegata').html('').html('--');	
	}
		
	$('#tipo_mercato_e').html('').html(fornitura.tipo_mercato+'&nbsp;');		
	$('#fasce').html('').html(fornitura.trattamento+'&nbsp;');		
	
	$('#tipologia_uso').html('').html(fornitura.categoria_uso+'&nbsp;');
	$('#classe_misuratore').html('').html(fornitura.classe_misuratore+'&nbsp;');	
	$('#coefficiente_conversione').html('').html(fornitura.coefficiente_conversione+'&nbsp;');
	$('#tipo_mercato_g').html('').html(fornitura.tipo_fornitura+'&nbsp;');	
	$('#tipologia_cliente').html('').html(fornitura.tipo_pdr+'&nbsp;');	
	
	if(fornitura.data_inizio_fornitura != null && fornitura.data_inizio_fornitura != '--'){
		$('#data_attivazione_fornitura_e').html('').html(formattaData(fornitura.data_inizio_fornitura)+'&nbsp;');
		$('#data_attivazione_fornitura_g').html('').html(formattaData(fornitura.data_inizio_fornitura)+'&nbsp;');	
	}else{
		$('#data_attivazione_fornitura_e').html('').html('--')
		$('#data_attivazione_fornitura_g').html('').html('--');	
	}
	
	$('#stato_misuratore_2g').html('').html(fornitura.stato_misuratore_2G+'&nbsp;')
	$('#tipo_tutela').html('').html(fornitura.tipo_tutela+'&nbsp;');
	
	if(fornitura.cliente_vulnerabile == 'Y'){
		$('#cliente_vulnerabile').html('').html('Sì');
		$('#cliente_vulnerabile_g').html('').html('Sì');
	}else{
		$('#cliente_vulnerabile').html('').html('No');
		$('#cliente_vulnerabile_g').html('').html('No');
	}
	
	
	//DA TOGLIERE SE SI REINTRODUCE LO STORICO
	data_inizio_prima_fornitura = fornitura.data_inizio_fornitura;
	if(data_inizio_prima_fornitura != '' && data_inizio_prima_fornitura != null && data_inizio_prima_fornitura != '--'){
		$('#inizio_prima_fornitura').html('').html(formattaData(data_inizio_prima_fornitura)+'&nbsp;');
	}else{
		$('#inizio_prima_fornitura').html('').html('--');
	}
	
	//storicoFornitura(fornitura);
}

function storicoFornitura(fornitura){
	//$('.box_storico_forniture').html('');
	//var html = '';
	//string_conf_fasce_storico = '';
	storico = [];
	
	if(fornitura.commodity == 'E'){
		$.each(getPod(fornitura.codice_pod_pdr).forniture, function( key, value ) {
			if(value.data_fine_fornitura != null && value.data_fine_fornitura != ''){
				storico.push(value);
				//mesi_switch.push({t: moment(new Date(value.data_fine_fornitura.substr(0,4), value.data_fine_fornitura.substr(4,2))), y : 10});
			}
		});
	}else if(fornitura.commodity == 'G'){
		$.each(getPdr(fornitura.codice_pod_pdr).forniture, function( key, value ) {
			if(value.data_fine_fornitura != null && value.data_fine_fornitura != ''){
				storico.push(value);
				//mesi_switch.push({t: moment(new Date(value.data_fine_fornitura.substr(0,4), value.data_fine_fornitura.substr(4,2))), y : 10});
			}
		});
	}
	
	/*
	if(storico.length == 0){
		$('.storico_forniture').hide();
	}else{
		$('.storico_forniture').show();
	}
	*/
	
	storico.sort(function(a,b){
		  return new Date(b.data_fine_fornitura) - new Date(a.data_fine_fornitura);
	});

	data_inizio_prima_fornitura = fornitura.data_inizio_fornitura;
	$.each(storico, function( key, value ) {
		if(key == storico.length-1 ){data_inizio_prima_fornitura = value.data_inizio_fornitura};
		/*
		if(fornitura.commodity == 'E'){
			html =  '<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-xs-12 box_label_fornitura box_label_fornitura_storico">'
					+'<p id="codice_pod">'+value.ragione_sociale_cc+'</p>'				
					+'</div>'
					+'<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-xs-12 box_label_fornitura box_label_fornitura_storico">'
					+'<p id="codice_pod">'+formattaData(value.data_inizio_fornitura)+' - '+formattaData(value.data_fine_fornitura)+'</p>'				
					+'</div>'
					+'<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-xs-12 box_label_fornitura box_label_fornitura_storico">'
					+'<p><a href="#" class="link_conf_fasce_storico" id="'+value.codice_fornitura+'">Configurazione fasce</a></p>'		
					+'</div>';
			
			var separator = '#';
			if(key==0){separator = ''};
		}else{
			html =  '<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-xs-12 box_label_fornitura box_label_fornitura_storico">'
				+'<p id="codice_pod">'+value.ragione_sociale_cc+'</p>'				
				+'</div>'
				+'<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-xs-12 box_label_fornitura box_label_fornitura_storico">'
				+'<p id="codice_pod">'+formattaData(value.data_inizio_fornitura)+' - '+formattaData(value.data_fine_fornitura)+'</p>'				
				+'</div>'
				+'<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-xs-12 box_label_fornitura box_label_fornitura_storico">'
				+'<p id="codice_pod">&nbsp;</p>'		
				+'</div>';			
		}

		
		$('.box_storico_forniture').append(html);
		if(typeof value.configurazione_fasce === 'undefined'){
			//$('#'+value.codice_fornitura).hide();
		}
		*/
	});

	if(data_inizio_prima_fornitura != '' && data_inizio_prima_fornitura != null && data_inizio_prima_fornitura != '--'){
		$('#inizio_prima_fornitura').html('').html(formattaData(data_inizio_prima_fornitura)+'&nbsp;');
	}else{
		$('#inizio_prima_fornitura').html('').html('--');
	}

//	$(".link_conf_fasce_storico").click(function(event){
//		event.preventDefault();
//		openConfFasce(event,event.target.id);
//	});
	
};

function configurazioneFasce(fornitura){
	var ora_prec;
	var giorni_array = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica','festivo'];
	var fasce_array = ['F1','F2','F3','F4','F5','F6'];
	var fasce_obj = {};
	var giorni_obj = {};
	string_conf_fasce = '';

	var table = $('.table-conf-fasce-template').html();
	$('.container_table-conf-fasce').html('');		

	var ul_html = '<ul class="nav nav-pills mb-3" id="pills-tab-e" role="tablist">';
	var fasce_html = '<div class="tab-content tab-content-e" id="pills-tabContent">';
	$.each(fornitura.configurazione_fasce, function( key, value ) {	
		var active = "";
		var da = formattaData(value.Data_Inizio_Configurazione);
		var a = formattaData(value.Data_Fine_Configurazione);
		if(key == 0){
			active = "active";
		}
		var al_str = '';

		if(a != ''){
			al_str = ' al '+a;
		}
		ul_html = ul_html + '<li class="nav-item '+active+'"><a class="nav-link nav-link-fasce" id="pills-consumi-tab" data-toggle="pill" role="tab" href="#pills-fasce-'+key+'" aria-controls="pills-consumi-'+key+'" aria-selected="true">Dal '+da+al_str+'</a></li>'
		fasce_html = fasce_html + table;
	
	});	
	ul_html = ul_html + '</ul>';
	fasce_html = fasce_html + '</div>';	
	
	$('.container_table-conf-fasce').append(ul_html).append(fasce_html);
	
	$.each(fornitura.configurazione_fasce, function( key, value ) {
		$($('.table-conf-fasce')[key]).addClass('table_index_'+key);		
		
		var index_key = key;
		if(index_key > 0){string_conf_fasce = string_conf_fasce+'_'};	
		$.each(fasce_array, function( key, value ) {
			$.each(giorni_array, function( key, value ) {
				$.each(fornitura.configurazione_fasce[index_key]['f_'+value].split(','), function( key, value ) {
					var fascia = value.split('-')[1];
					var ora = (value.split('-')[0]/4).toString();
					if(ora < 10){ora = '0'+ora;}
					var quarti = ora % 1;
					if(quarti % 1 == 0){ 
						ora = ora+':00'
					}else{
						var minuti = ora.split('.')[1]*0.60;
						if(minuti<10){minuti = minuti+'0'};
						ora = ora.split('.')[0]+':'+minuti;
					};
					var range;
					if(key == 0){
						range = '00:00 - '+ora;
					}else{
						range = ora_prec+' - '+ora;
					}

					if(typeof fasce_obj['F'+fascia] === 'undefined'){
						fasce_obj['F'+fascia] = range;
					}else{
						fasce_obj['F'+fascia] = fasce_obj['F'+fascia]+' <br> '+ range;
					}
					ora_prec = ora;
				});
				
				giorni_obj[value] = fasce_obj;
				fasce_obj = {};
			});
		});	
		
		$.each(fasce_array, function( key, value ) {
			var fascia = value;
			$('.table_index_'+index_key+' #conf_'+fascia).html('<td class="fascia" >'+fascia+'</td>');
			$.each(giorni_array, function( key, value ) {
				var giorno = value;
				if(typeof giorni_obj[giorno][fascia] !== 'undefined'){
					$('.table_index_'+index_key+' #conf_'+fascia).append('<td>'+giorni_obj[giorno][fascia]+'</td>');
					string_conf_fasce = string_conf_fasce+'@'+giorni_obj[giorno][fascia];
				}else{
					$('.table_index_'+index_key+' #conf_'+fascia).append('<td>-</td>');
					string_conf_fasce = string_conf_fasce+'@-';
				}	
			});	
		});	
		
	});	
		
	$(".tab-pane-fasce").each(function( index ) {
		if(index == 0){
			$(this).addClass("active in");
		}
		$(this).attr("id","pills-fasce-"+index);
	});
	

};

function getPod(id){
	var res = $.grep(big_data_forniture_E.pod, function(v) {
	    return v.codice_pod === id;
	});
	return res[0];
};

function getPdr(id){
	var res = $.grep(big_data_forniture_G.pdr, function(v) {
	    return v.codice_pdr === id;
	});
	return res[0];
};

function openConfFasce(e, codice_fornitura){
	e.preventDefault();
	if(typeof codice_fornitura !== 'undefined' ){
		curr_fornitura = getFornituraStorico(codice_fornitura);
	}else{
		curr_fornitura = fornitura;
	}
	if(curr_fornitura.trattamento.toUpperCase() == 'DA CONTRATTO'){	
		configurazioneFasce(curr_fornitura);
		$('#modal_conf_fasce').modal('show');		
	}else if(curr_fornitura.trattamento.toUpperCase() == 'REGOLATE DA ARERA'){
		$('#modal_conf_fasce_default').modal('show');	
	}
};

function getFornituraStorico(id){
	var res = $.grep(storico, function(v) {
	    return v.codice_fornitura === id;
	});
	return res[0];
};

function formattaData(data){
	if(data != null && data != ''){
		var date = new Date(data.substr(0,4), data.substr(4,2)-1 ,data.substr(6,4));
		return $.format.date(date,"dd/MM/yyyy");
	}else{
		return '';
	}
};


function addPreferiti(e){
	e.preventDefault();
	var list = '';
	if(getCookie(COOKIE_LIST_FOR) != '' ){
		list = getCookie(COOKIE_LIST_FOR);
	}
	if(list.indexOf(fornitura.codice_fornitura) == -1){
		list = list + fornitura.codice_fornitura + ',';
	}
	setCookie(COOKIE_LIST_FOR, list , 30);
	$('.add_preferiti').toggleClass('hidden');
	$('.remove_preferiti').toggleClass('hidden');
	
	//Ricarico la tendina
	popolaTendinaForniture(lista_pod_pdr, true);
};

function removePreferiti(e){
	e.preventDefault();
	var list = getCookie(COOKIE_LIST_FOR).split(',');
	list.splice($.inArray(fornitura.codice_fornitura, list),1);
	setCookie(COOKIE_LIST_FOR, list , 30);		
	$('.add_preferiti').toggleClass('hidden');
	$('.remove_preferiti').toggleClass('hidden');
	
	//Ricarico la tendina
	popolaTendinaForniture(lista_pod_pdr, true);
};

function preferitiCtrl(){
	if(getCookie(COOKIE_LIST_FOR) != null && getCookie(COOKIE_LIST_FOR).indexOf(fornitura.codice_fornitura) != -1){
		$('.add_preferiti').addClass('hidden')
		$('.remove_preferiti').removeClass('hidden');
	}else{
		$('.add_preferiti').removeClass('hidden')
		$('.remove_preferiti').addClass('hidden');
	}
};

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
};

function deleteCookie( name ) {
	  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

function getCookie(cname) {
	  var name = cname + "=";
	  var decodedCookie = decodeURIComponent(document.cookie);
	  var ca = decodedCookie.split(';');
	  for(var i = 0; i <ca.length; i++) {
	    var c = ca[i];
	    while (c.charAt(0) == ' ') {
	      c = c.substring(1);
	    }
	    if (c.indexOf(name) == 0) {
	      return c.substring(name.length, c.length);
	    }
	  }
	  return "";
}

function popolaTendinaForniture(lista_pod_pdr, dettaglio){
	var li_hidden = '';
	var show_all = false;

	//Ciclo la lista delle forniture e sposto in fondo quelle nei preferiti
	$.each(lista_pod_pdr , function( key, value ) {
		if(getCookie(COOKIE_LIST_FOR).indexOf(value.codice_fornitura) < 0 ){
			lista_pod_pdr.splice(key, 1);
			lista_pod_pdr.unshift(value);
		}
	});
	
	//Inverto la lista per avere i preferiti in cima
	lista_pod_pdr.reverse();
	
	
	$('.box_select_forniture').find('.dropdown-menu').html('');
	if(!dettaglio){
		//Inserisco un <li> vuoto 
		var empty_li = "<li onclick=\"selezionaFornitura('empty','empty')\"><a id=\"\" title=\"Nessuna fornitura\" class=\"link_fornitura\" ><p>" +
				"<img alt=\"Nessuna fornitura\" src="+context+"/resources/static/img/icon_empty.png>" +
			  	"<span class=\"select_indirizzo\">Non utilizzare i dati delle mie forniture</span>" +
				"</p></a>" +
				"</li>";
		$('.box_select_forniture').find('.dropdown-menu').append(empty_li);
	}
	
	$.each(lista_pod_pdr , function( key, value ) {
		var star = "";
		if(getCookie(COOKIE_LIST_FOR).indexOf(value.codice_fornitura) >= 0){
			star = "glyphicon glyphicon-star";
		}
		//Se il numero di forniture è superiore al limite le nascondo
		if(key >= LIMITE_NUMERO_FORNITURE){
			li_hidden = 'li_hidden';
			show_all = true;
		}
		
		if(dettaglio){
			var tipoTutela;
			
			if(typeof value.tipo_tutela !== 'undefined'){
				if(value.tipo_tutela.toUpperCase() == salvaguardia.toUpperCase()){
					tipoTutela = 'SALVAGUARDIA';
				}else if(value.tipo_tutela.toUpperCase().includes(tutele_graduali) && value.tipo_tutela.toUpperCase() != tutele_graduali_domestici.toUpperCase()){
					tipoTutela = 'TUTELE_GRADUALI';
				}else{
					tipoTutela = 'TUTELE_GRADUALI';
				};
			}
			
			var html_li = "<li class=\""+li_hidden+"\" onclick=\"submitDettaglioFornitura('"+value.codice_offerta+"','"+value.codice_fornitura+"','"+value.commodity+"', '"+tipoTutela+"')\" id="+value.count+"><a id="+value.codice_fornitura+" title=\"Vai alla fornitura: "+value.codice_fornitura+"\" class=\"link_fornitura\" ><p>" +
			"<img alt=\"Tipo commodity\" src="+context+"/resources/static/img/icon_"+value.commodity+".png>" +
		  	"<span class=\"select_indirizzo\">"+value.ragione_sociale_cc+" -\ "+value.toponimo_Indirizzo+ " " + value.nome_strada+" "+value.civico+", "+value.cap+" "+value.comune+"</span><br>" +
			"<span class=\"select_pod\">"+value.tipo_punto+": "+value.codice_pod_pdr+"</span>" +
			"<span class='"+star+"'></span></p></a>" +
			"</li>";
			$('.box_select_forniture').find('.dropdown-menu').append(html_li);
		}else{
			var html_li = "<li class=\""+li_hidden+"\" id="+value.count+"><a onclick=\"selezionaFornitura('"+value.codice_fornitura+"','"+value.commodity+"')\" id="+value.codice_fornitura+" title=\"Seleziona la fornitura: "+value.codice_fornitura+"\" class=\"link_fornitura\" >" +
			"<p><img alt=\"Tipo commodity\" src="+context+"/resources/static/img/icon_"+value.commodity+".png>" +
		  	"<span class=\"select_indirizzo\">"+value.ragione_sociale_cc+" -\ "+value.toponimo_Indirizzo+ " " + value.nome_strada+" "+value.civico+", "+value.cap+" "+value.comune+"</span><br>" +
			"<span class=\"select_pod\">"+value.tipo_punto+": "+value.codice_pod_pdr+"</span>" +
			"<span class='"+star+"'></span></p></a>" +
			"</li>";
			$('.box_select_forniture').find('.dropdown-menu').append(html_li);
		}
	});	
	
	//se è stato superato il limite fissato inserisco il link per visualizzare tutte le forniture
	if(show_all){
		$('.box_select_forniture').find('.dropdown-menu').append("<div onclick=\"showAll(event)\" id=\"link_show_all\" class=\"link_show_all\">Vedi tutte le forniture</div>");
		$('.box_select_forniture').find('.dropdown-menu').append("<div onclick=\"hideOthers(event)\" id=\"link_hide_all\" style=\"display:none;\" class=\"link_show_all\">Nascondi le forniture</div>");
	};
};

function creaHtmlFornituraSelezionata(value){
	var html_li = "<span class=\"arrowDown\"></span><p><img alt=\"Tipo commodity\" src="+context+"/resources/static/img/icon_"+value.commodity+".png>" +
	"<span class=\"select_indirizzo\">"+value.ragione_sociale_cc+" -\ "+ value.toponimo_Indirizzo + " "+value.nome_strada+" "+value.civico+", "+value.cap+" "+value.comune+"</span> <br>" +
	"<span class=\"select_pod\">"+value.tipo_punto+": "+value.codice_pod_pdr+"</span>"+
	"</p>";
	return html_li;
};

function showAll(e){
	$('.box_select_forniture').find('.li_hidden').addClass('li_show').removeClass('li_hidden');
	$('#link_show_all').hide();
	$('#link_hide_all').show();
	e.stopPropagation();
};

function hideOthers(e){
	$('.box_select_forniture').find('.li_show').addClass('li_hidden').removeClass('li_show');
	$('#link_hide_all').hide();
	$('#link_show_all').show();
	e.stopPropagation();
};

function submitDettaglioFornitura(codiceOfferta, codiceFornitura, commodity, tipoTutela){
	$('input[name="codiceOfferta"]').val(codiceOfferta);
	$('input[name="codiceFornitura"]').val(codiceFornitura);
	$('input[name="commodity"]').val(commodity);
	$('input[name="tipoTutela"]').val(tipoTutela);	
	$('.form_codice_offerta').submit();
};