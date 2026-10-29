function verificaPotenza(){
	if( $('#scegliPotenza').val()=='Altro'){
		$('#wrapperAltroValore').removeClass('hidden');
	}else{
		$('#wrapperAltroValore').addClass('hidden');
	}
};
	 
var init_mt;

function checkAltroValorePotenza(elm){
	//Dal 01/01/2021 per alri usi && potenza > 15 no diritto MT
	var start = new Date(2021,00,01);
	var today = new Date();
	if(today < start){
		return false;
	}
	
	var msg = 'Dal 01/01/2021 non è più possibile usufruire della Maggior Tutela per potenza superiore a 15 kW';
	if(typeof init_mt === 'undefined' ){
		init_mt = $('#maggiorTutela').val();
	}
	var commodity = $('input[name="commodityType"]:checked').val();
	var pot = elm.value ;
	var dove = $('input[name="dove"]:checked').val();
	if(pot > 15 && dove == 'attivita' && commodity == 'energiaElettrica' && init_mt == 'TUTELA'){
		$('#maggiorTutela').val('');
		if($('#msg_no_mt').length == 0){
			$('#altroValore').after('<span id="msg_no_mt">'+msg+'</span>');
		}else{
			$('#msg_no_mt').html('').html(msg);	
		}
	}else{
		$('#maggiorTutela').val(init_mt);
		$('#msg_no_mt').html('');	
	}
};

var disale_mt;

function checkAltroValorePotenzaAvanzate(pot, mt){
	//Dal 01/01/2021 per alri usi && potenza > 15 no diritto MT
	var start = new Date(2021,00,01);
	var today = new Date();
	if(today < start){
		return false;
	}
	
	var msg = 'Dal 01/01/2021 non è più possibile usufruire della Maggior Tutela per potenza superiore a 15 kW';
	//var curr_mt = $('input[name="maggiorTutela"]:checked').val();
	var curr_mt = $('maggiorTutela').val();
	var dove = $('#luogo').val();

	if(mt != null){
		pot = $('#altroValore').val();
		if(pot > 15 && dove == 'attivita' && mt == 'TUTELA'){
			disale_mt = true;
		}else{
			disale_mt = false;
		}		
	}else{
		if(pot > 15 && dove == 'attivita' && curr_mt == 'TUTELA'){
			disale_mt = true;
		}else{
			disale_mt = false;
		}	
	}

	if(disale_mt){
		if($('#msg_no_mt').length == 0){
			$('#altroValore').after('<span id="msg_no_mt">'+msg+'</span>');
		}else{
			$('#msg_no_mt').html('').html(msg);	
		}		
	}else{
		$('#msg_no_mt').html('');		
	}
};

function conosciConsumo(){
	var conosciConsumi = $('input[name="conosci"]:checked').val();
	if($('input[name="conosci"]:checked').val()=='SI' || typeof conosciConsumi === 'undefined'){
		//VERIFICO IL TIPO DI PREZZO FASCE/MONO
		//----- FASCE
		//------------ Visualizzo i campi "Fasce"
		//------------ Nascondo il campo del consumo monorario e faccio il reset
		//
		//----- MONORARIO
		//------------ Visualizzo il campo del consumo monorario
		//------------ Nascondo i campi "Fasce" e faccio il reset dei valori
		//
		var usaConsumiFornitura = $('input[name="usaConsumi"]:checked').val();
		//Se si è scelto di usare i consumi della fornitura selezionata non serve visualizzare i campi del consumo fasce/mono
		if(usaConsumiFornitura == 'NO' || typeof usaConsumiFornitura == 'undefined'){
			$('#fieldsetConsumoAnnuo').show();			
			if($('#tipoTariffa').val()=='monoraria'){
				$('#consumoSingolo').show();
				$('#consumoFasce').hide();
			}else if($('#tipoTariffa').val()=='fasce'){
				$('#consumoFasce').show();
				$('#consumoSingolo').hide();
			}
		}

		//Se è fasce ripartisco i consumi
		if($('#tipoTariffa').val()=='fasce'){
			riempiFasce();
			$('#consumoSingolo').find('input').val('');
		}else{
			$('#consumoFasce').find('input').val('');			
		}
		
		//NASCONDO I CAMPI PER LA STIMA DEI CONSUMI
		$('#fieldsetStimaConsumi').hide();
	}else if( $('input[name="conosci"]:checked').val() == 'NO')  {
		//NASCONDO IL CAMPO DEI CONSUMI
		//VISUALIZZO I CAMPI PER LA STIMA DEI CONSUMI
		$('#fieldsetConsumoAnnuo').hide();
		$('#fieldsetStimaConsumi').show();
	}
};

function cambiaUbicazioneEE(){
	//--- CASA
	//------------- Nascondo il campo "Tutela"
	//------------- Visualizzo il campo "Residente"
	//------------- Visualizzo il campo "Conosci consumi"
	//
	//--- ALTRI USI
	//------------- Visualizzo il campo "Tutela"
	//------------- Nascondo il campo "Residente"
	//------------- Nascondo il campo "Conosci consumi" e chiamo conosciConsumo() per visualizzare i consumi in base a fascie/monorario
	//------------- Visualizzo il campo "Consumo"
	var dove = $('input[name="dove"]:checked').val();
	if(dove == 'casa'){
		$('#opzMaggiorTutela').hide();
		$('#fieldsetResidenza').show();
		$('.fieldsetConosci').show();
		$('#fieldsetClientiVulnerabili').show();
	}
	if(dove == 'attivita' || dove == 'altriUsi'){
		$('#opzMaggiorTutela').show();
		$('#fieldsetResidenza').hide();
		$('.fieldsetConosci').hide();
		$('#fieldsetConsumoAnnuo').show();
		$('#fieldsetClientiVulnerabili').hide();
		conosciConsumo();
	} 
};

function cambiaUbicazioneDUAL(){
	cambiaUbicazioneEE();
	cambiaUbicazioneGAS();
};

function cambiaUbicazioneGAS(){
	//--- CASA
	//------------- Prevalorizzo la classe contatore "1"
	//------------- Visualizzo il campo "Cocnosci"
	//------------- Visualizzo il campo "Vulnerabili"
	//
	//--- ALTRI USI/CONDOMINIO
	//------------- Prevalorizzo la classe contatore "2"
	//------------- Nascondo il campo "Conosci"
	//------------- Nascondo il campo "Vulnerabili"
	//------------- Visualizzo il campo consumo annuo
	var dove = $('input[name="dove"]:checked').val();
	if(dove == 'casa'){					 
		$('#scegliClasse').val('1');	
		$('.fieldsetConosci').show();
		$('#fieldsetClientiVulnerabili').show();
	}else if(dove == 'altriUsi' || dove == 'condominio'){
		$('#scegliClasse').val('2');
		$('.fieldsetConosci').hide();
		$('#fieldsetClientiVulnerabili').hide();
		$('#fieldsetConsumoAnnuoGas').show();
	}
	
	//Gestisco la visualizzazione dei tipi di uso 
	$('#opzioniGas input:checkbox').attr('checked',false);
	if(dove != 'condominio'){
		$('#opzioniGas').show();
		if(dove=='casa'){					 
			$('#usoDomestico').removeClass('hidden');
			$('#usoNonDomestico').addClass('hidden');
		}else{
			$('#usoDomestico').addClass('hidden');
			$('#usoNonDomestico').removeClass('hidden');
		}
	}else{
		$('#opzioniGas').hide();
	}
	
};

function checkFormTipo(){
	$('.field_required_message').remove();
	var commodity = $('input[name="commodityType"]:checked').val();
	var ok = true;
	if(!checkRadioBtn('commodityType')){
		return false;
	}else if(!checkCapField()){
		return false;
	}else if(!checkRadioBtn('dove')){
		return false; 
	}else if(!isCodOffertaValid){
		$('.codiceOfferta').focus();
		return false;		
	}else if(!checkRadioBtn('tipoOfferta')){
		return false;
	}else if(!checkResidente()){
		return false;
	}
	flussoAvanzamento(ok, null,commodity);
};

function checkFormCaratteristiche(){
	$('.field_required_message').remove();
	var dove = $('input[name="dove"]:checked').val();
	var usaConsumiFornitura = $('input[name="usaConsumi"]:checked').val();
	
	var ok = true;
	if(!checkLivelloPotenza()){
		return false; 
	}else if(!checkRadioBtn('conosci') && dove == 'casa' && usaConsumiFornitura == 'NO'){
		return false; 
	}else if(!checkConsumo() && usaConsumiFornitura == 'NO'){
		return false; 
	}else if(!checkConsumoTotaleEE($('#consumoAnnuoSomma').val())){
		return false; 
	}
	return ok;
};
 
function checkCapField(){
	var url = contextPath; 
	var ok = true;
	var capComune = $('#capComune').val().trim();
	var codiceIstatComune = $('#codiceIstatComune').val();
	
	if(capComune.length >= 5){
		
		var cap;
		if(capComune.length > 5 && $.isNumeric(capComune.substring(0,5))){
			cap = capComune.substring(0,5);
		}else if(capComune.length = 5 && $.isNumeric(capComune)){
			cap = capComune;
		}else{
			cap = capComune;
		}
		
		$.ajax({
			url: url+"/api/rs/it/portal/geoService.json?cap-comune="+cap,
			async: false,
			}).done(function (data) {
    			if(data.response.result.services.size == 0 || codiceIstatComune == '' || codiceIstatComune == 'null'){
                	$('#capComune').focus();
                	$('#capComune').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Comune inesistente</div>');
                	ok = false;
                }else{
                	var item;
                	if(data.response.result.services.size == 1){
                		item = data.response.result.services.item;
                	}else if(data.response.result.services.size > 1 ){
                		
                		if(/^\d+$/.test(cap)){
                			//E' un CAP
                			item = data.response.result.services.item[0];
                		}else{
                    		for (i = 0; i < data.response.result.services.item.length; ++i) {
                    			if(data.response.result.services.item[i].denominazione == cap){
                            		item = data.response.result.services.item[i];	
                    			}	
                    		}; 
                		}
                	}
                	
                	var commodity = $('input[name="commodityType"]:checked').val();
                	if(item.esclusoOffertaGas == 1 && (commodity == 'gas' || commodity == 'dual')){
                		$('#capComune').focus();
                		$('#capComune').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Nel comune selezionato non è disponibile il servizio Gas</div>');
                		ok = false;
                	}
                	if(item.esclusoOffertaEE == 1 && (commodity == 'energiaElettrica' || commodity == 'dual')){
                		$('#capComune').focus();
                		$('#capComune').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Per il comune selezionato non sono disponibili offerte di Energia Elettrica</div>');
                		ok = false;
                	}                	
                }
            });
	}else{
		if(capComune.length < 5 && capComune.length > 0  && (codiceIstatComune == '' || codiceIstatComune == 'null')){
			$('#capComune').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Formato CAP errato</div>');
			ok = false;
		}else{
			ok = checkInputText('capComune');
		}
	}	 
	return ok;
};

function checkResidente(){
	var chcked = $('input[name="dove"]:checked').val();
	if(chcked == 'attivita' || chcked == 'condominio' || chcked == 'altriUsi'){
		return true;	 
	}else{
		return checkRadioBtn('residente'); 
 	}
};
 
function checkLivelloPotenza(){
	if($('#scegliPotenza').val() == 'Altro'){
		//verifico kw desiderati
		return checkInputText('altroValore');
	}else{
		return checkInputText('scegliPotenza');
	}
};
 

function checkConsumo(){
	if($('input[name="conosci"]:checked').val() == 'NO'){return true;}
	
	if($('#tipoTariffa').val() == 'monoraria'){
		return checkInputText('ConsumoAnnuo');
	}else{
		if(!checkInputText('fascia1')){
			return false;
		}else if(!checkInputText('fascia2')){
			return false;
		}else if(!checkInputText('fascia3')){
			return false;
		}else{
			return true;
		}
	}
};
 
function checkRadioBtn(nome){
	var ok = true; 
	var valore= $('input[name="'+nome+'"]:checked').val();
	if(!valore){
		ok = false;
		$('input[name="'+nome+'"]').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Il campo è obbligatorio</div>');
	}
	return ok;
};
 
function checkInputText(id){
	var ok = true;
	if($('#'+id).val().trim() == ''){
		ok = false;
		$('#'+id).focus();
		$('#'+id).parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Il campo è obbligatorio</div>');
	}
	return ok;
};
 
function notNumberErr(id){
	$('#'+id).focus();
	$('#'+id).parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Il formato inserito non è corretto</div>');
	return false;
};
 
function confrontaOfferteEE(){
	valorizzaElementiUso();
	fillMultiselects();
	if(checkFormCaratteristiche() == true){
		$('#confrontaOfferte1').submit();
	};	
};
 
function indietro(){
	$('.box_info_forniture_spid').show();
	$('#step a[href="#tipo"]').tab('show') 
};

function indietroStep2(){
	$('#step a[href="#caratteristicheEE"]').tab('show') 
};

function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    	sURLVariables = sPageURL.split('&'),
    	sParameterName,
    	i;

    for (i = 0; i < sURLVariables.length; i++) {
    	sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
        	var val = sParameterName[1] === undefined ? true : sParameterName[1];
        	return val;
        }
    }
};

function changeTipoOfferta(type, codice_offerta){
	var cap = getUrlParameter('cap-comune');
	if(typeof cap !== 'undefined' ){
		cap = getUrlParameter('cap-comune');
	}else{
		cap = '';
	}

	var istat = getUrlParameter('code-istat');
	if(typeof istat !== 'undefined' ){
		istat = getUrlParameter('code-istat');
	}else{
		istat = '';
	}
	
	document.location = confrontaOffertePageUrl+'?tipoOfferta='+escapeHtml(type)+'&cap-comune='+escapeHtml(cap)+'&code-istat='+escapeHtml(istat)+'&fornitura='+escapeHtml(codice_offerta);
};

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function forceNumeric() {
    var $input = $(this);
    $input.val($input.val().replace(/[^\d]+/g, ''));

}


var distribuzDomestico = {"F1":0.33,"F2":0.31,"F3":0.36};
var distribuzNonDomestico = {"F1":0.44,"F2":0.24,"F3":0.32};

function riempiFasce(){
	var totale = $('#consumoAnnuoSomma').val();
	var domestico =  $('input[name="dove"]:checked').val()=='casa';
	var valF1=0; 
	var valF2 =0;
	var valF3 =0;
	if (totale !=''){
		if(domestico){
		valF1 = parseFloat(totale*distribuzDomestico.F1,10).toFixed(0);
		valF2 = parseFloat(totale*distribuzDomestico.F2,10).toFixed(0);
		valF3=totale-valF1-valF2;
		}else {
		valF1 = parseFloat(totale*distribuzNonDomestico.F1,10).toFixed(0);
		valF2 = parseFloat(totale*distribuzNonDomestico.F2,10).toFixed(0);
		valF3=totale-valF1-valF2;
		}
			
		$('#fascia1').val(valF1);
		$('#fascia2').val(valF2);
		$('#fascia3').val(valF3);
		}
	else{
		$('#fascia1').val('');
		$('#fascia2').val('');
		$('#fascia3').val('');
	}
};


function riempiTotale(){
	
		var valF1=$('#fascia1').val();
		var valF2=$('#fascia2').val();
		var valF3=$('#fascia3').val();
		if(valF1!='' && valF2!='' && valF3!=''){
			var somma=parseFloat(valF1)+parseFloat(valF2)+parseFloat(valF3);
			$('#consumoAnnuoSomma').val(somma.toFixed(0));
			}	
		else{
			$('#consumoAnnuoSomma').val('');
			}	
	
};

//GAS
function checkFormTipoGas(){
	$('.field_required_message').remove();
	var ok = true;
	if(!checkCapField()){
		return false;
	}else if(!checkRadioBtn('dove')){
		return false;
	}else if(!isCodOffertaValid){
		$('.codiceOfferta').focus();
		return false;		
	}else if(!checkRadioBtn('tipoOfferta')){
		return false; 
	}	
	var commodity = $('input[name="commodityType"]:checked').val();
	flussoAvanzamento(ok, null, commodity);
};

function checkFormCaratteristicheGas(){
	$('.field_required_message').remove();
	var ok = true;
	if(!checkClasseContatore()){
		return false; 
	}else
	if(!checkOpzioniGas()){
		return false; 
	}else if(!checkInputText('ConsumoAnnuoGas')){
		if($('input[name="conosciGas"]:checked').val() == 'NO'){return true;};
		return false; 
	}else if(!checkConsumoTotaleGas($('#ConsumoAnnuoGas').val())){
		if($('input[name="conosciGas"]:checked').val() == 'NO'){return true;};
		return false; 
	}
	return ok;
};

function checkClasseContatore(){
	var ok = true;
	if($('#scegliClasse').val() == ''){
		ok = false;
		$('#scegliClasse').focus();
		$('#scegliClasse').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Il campo è obbligatorio</div>');
	}
	return ok;
};

function radioSelection(radioName){
	$('.field_required_message').remove();
	$('input[name='+radioName+']:checked').parent().addClass("sel").removeClass("transitionLabel");
	$('input[name='+radioName+']:checked').parent().next('div').addClass('checkImg');
	$('input[name='+radioName+']:not(:checked)').parent().removeClass("sel").addClass("transitionLabel");
	$('input[name='+radioName+']:not(:checked)').parent().next('div').removeClass('checkImg');
};

function conosciConsumoGas(){
	$('#ConsumoAnnuoGas').val('');
	if( $('input[name="conosciGas"]:checked').val()=='SI'){
		$('#fieldsetStimaConsumoGas').hide();
		$('#fieldsetConsumoAnnuoGas').show();
	} else if( $('input[name="conosciGas"]:checked').val()=='NO')  {
		$('#fieldsetConsumoAnnuoGas').hide();
		$('#fieldsetStimaConsumoGas').show();
	}
};

function checkConsumoTotaleGas(consumo){
	var ok = true;
	var dove = $('input[name="dove"]:checked').val();	
	if(dove == 'altriUsi' || dove == 'condominio'){
		if(consumo > 200000){
			ok = false;
			$('#ConsumoAnnuoGas').focus();
			$('#ConsumoAnnuoGas').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Il consumo annuo non può essere superiore a 200.000 Smc</div>');
		}
	}
	return ok;
};

function checkConsumoTotaleEE(consumo){
	if($('input[name="conosci"]:checked').val() == 'NO'){return true;}
	var ok = true;
	if(consumo > 1000000){
		ok = false;
		$('#consumoAnnuoSomma').focus();
		$('#consumoAnnuoSomma').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">Il consumo annuo non può essere superiore a 1.000.000 kWh</div>');
	}
	return ok;
};

function checkOpzioniGas(){
	var ok = true;
	if($('input[name="dove"]:checked').val() != 'condominio'){
		if(!($('input[name="categoriaUsoCot"]').is(':checked') || $('input[name="categoriaUsoAcq"]').is(':checked') || $('input[name="categoriaUsoRisc"]').is(':checked') || $('input[name="categoriaUsoTec"]').is(':checked'))){
			ok = false;
			$('#step').focus();
			$('#cottura').parents('.fieldsetContainer').prepend('<div class="alert alert-warning field_required_message" role="alert">La categoria di utilizzo è obbligatoria</div>');
		}
	}
	return ok;
}



function confrontaOfferteGas(){
	fillMultiselects();
	if(checkFormCaratteristicheGas() == true){
		$('#confrontaOfferte1').submit();
	};	
};

function forceNumeric() {
    var $input = $(this);
    $input.val($input.val().replace(/[^\d]+/g, ''));

};

function checkNumClimatizzatori(oggetto){
	if(oggetto.checked){
 $('#numeroClima').removeClass('hidden')
 }
 else{
	  $('#numeroClima').addClass('hidden')
	 }
 };

function valorizzaElementiUso(){
	var str = [];
	//select
	$('#fieldsetStimaConsumi select[name=idElementoUso]').each(function () { 
		str.push($(this).val());
	});
	//checkbox
	$('#fieldsetStimaConsumi input[name=idElementoUso]:checked').each(function () { 
		str.push($(this).val());
	});
	$('#idElementiUsoHidden').val(str);
};

function vaiAlDettaglio(tutela, offerta, offertaConfronto, idTipoOfferta, tipoTariffa){
	if(tutela == true){
		$('#isTutela').val(true);
	}else{
		$('#idOfferta').val(offerta);
	}
	if(offertaConfronto == true){
		$('#isOffertaConfronto').val(true);
		$('#idTipoOfferta').val(idTipoOfferta);
		$('#tipoTariffaConfronto').val(tipoTariffa);		
	}else{
		$('#isOffertaConfronto').val(false);
		$('#idTipoOfferta').val(null);
		$('#tipoTariffaConfronto').val(null);	
	}
	$('#formDettaglioOfferta').submit();
};

function vaiAlDettaglioTutGrad(codOfferta){
	$('#codOffertaTutGrad').val(codOfferta);
	$('#formDettaglioOffertaTutGrad').submit();
};

function vaiAlDettaglioML(tutela, offerta, offertaConfronto, idTipoOfferta, tipoTariffa){
	if(tutela == true){
		$('#isTutelaML').val(true);
	}else{
		$('#idOffertaML').val(offerta);
	}
	if(offertaConfronto == true){
		$('#isOffertaConfrontoML').val(true);
		$('#idTipoOffertaML').val(idTipoOfferta);
		$('#tipoTariffaConfrontoML').val(tipoTariffa);	
	}else{
		$('#isOffertaConfrontoML').val(false);
		$('#idTipoOffertaML').val(null);
		$('#tipoTariffaConfrontoML').val(null);	
	}
	$('#formDettaglioOffertaML').submit();
};

function flussoAvanzamento(step1, step2, commodity){
	$('.box_info_forniture_spid').hide();
	
	var error_call_misure = false;
	if(commodity == 'energiaElettrica' || commodity == 'gas'){
		if(step1){
			$('#step2').removeClass('disabled');
			$('#step2 a').removeClass('disabledEvent');
			$('#step a[href="#caratteristiche"]').tab('show');
		}else{
			$('#step2').addClass('disabled');
			$('#step2 a').addClass('disabledEvent');
		}
		
		//Se è stata selezionata una fornitura chiamo il servizio per recuperare le misure solo per gas e elettrico
		var codFornitura = getUrlParameter('fornitura');
		if(typeof codFornitura !== 'undefined' && codFornitura != ''){
			//Apro il loading di ricerca delle misure
			$('#modalLoadingMisure').modal('show')

			//Nel caso di fornitura selezionata il campo "conosci" non deve essere visualizzato di default
			$('.fieldsetConosci').hide();
			
			var fornitura_selezionata_obj = $.grep(lista_pod_pdr, function(v) {
			    return v.codice_fornitura === codFornitura;
			});	
		
			var method_misure;
			if(commodity == 'energiaElettrica'){
				method_misure = 'consumiElettricoService';
			}else if(commodity == 'gas'){
				method_misure = 'consumiGasService';
			}

		    $.ajax({
		    	url: context+"/api/rs/it/"+method_misure+".json?code="+fornitura_selezionata_obj[0].codice_pod_pdr
		    }).done(function (data) {
		    	var big_data = $.parseJSON(data.response.result);
		    	var stato_fasce = getStatoConfFasce(fornitura_selezionata_obj[0]);
		    	var consumoAnnuo = 0;
		    	//Verifico se ci sono configurazione delle fasce
		    	//STATO 0 - Monorario/Standard o Gas
		    	//			Inviare Mensili/Giornalieri in base allo stato delle misure
		    	//			Inviare consumi totali
		    	
		    	//STATO 1 - Inviare a BE la configurazione fasce
		    	//		  - Inviare Mensili e Giornalieri in base allo stato delle misure
		    	//		  - Inviare consumi totali per ogni fascia 	
		    	
		    	//STATO 2 - Non Inviare a BE la configurazione fasce
		    	//		  - Inviare Mensili ridistribuiti per le fasce F1-F2-F3 in base allo stato delle misure
		    	//		  - Inviare consumi totali ridistribuiti per le fasce F1-F2-F3 		
		    	
		    	//STATO 3 - Inviare a BE la configurazione fasce
		    	//		  - Inviare Mensili e Giornalieri in base allo stato delle misure
		    	//		  - Inviare consumi totali per ogni fascia 
		    	
		    	//STATO 4 - Non Inviare a BE la configurazione fasce
		    	//		  - Inviare Mensili ridistribuiti per le fasce F1-F2-F3 in base allo stato delle misure
		    	//		  - Inviare consumi totali ridistribuiti per le fasce F1-F2-F3 	

	    		misure_mensili_ultimi_12_mesi = getMisureMensili12Mesi(big_data, commodity); 	
	    		misure_giornaliere_ultimi_12_mesi = getMisureGiornaliere12Mesi(big_data, commodity);	

	    		//Creo l'oggetto dei consumi totali
	    		var consumiTotali = creaObjConsumoTotale(misure_mensili_ultimi_12_mesi, commodity);
	    		console.log('CONS. TOTALI:');
	    		console.log(consumiTotali);    	
	    		
	    		//Valorizzo il form con l'oggetto dei consumi totali
	    		if(stato_fasce == 2 || stato_fasce == 4){
	    			//In questo caso il consumo totale deve essere ripartiti nelle fasce F1-F2-F3
	    			consumiTotali = ripartizioneFasceConsumoTotale(consumiTotali);
	    			$('input[name="consumiTotaliEE"]').val(JSON.stringify(consumiTotali));
	    			//In questo caso le misure devono essere ridistribuite nelle fasce F1-F2-F3
	    			misure_mensili_ultimi_12_mesi = distribuisciConsumiPerFasceStandard(misure_mensili_ultimi_12_mesi, commodity);
	    		}else{
	      			$('input[name="consumiTotaliEE"]').val(JSON.stringify(consumiTotali));
	    		}
	    		
	    		//Valorizzo il form con l'oggetto della configurazione fasce
		    	if(stato_fasce == 1 || stato_fasce == 3){
					var ultima_fascia = fornitura_selezionata_obj[0].configurazione_fasce.find(item => item.Data_Fine_Configurazione == "" || item.Data_Fine_Configurazione == null );	
		    		//Rimuovo proprietà che non servono
					delete ultima_fascia.Data_Inizio_Configurazione;
					delete ultima_fascia.Data_Fine_Configurazione;
					delete ultima_fascia.Data_Freezing;
					$('input[name="configurazioneFasce"]').val(JSON.stringify(ultima_fascia));
		    	}
	    	
		    	var stato_misure = getStatoMisure(misure_mensili_ultimi_12_mesi, misure_giornaliere_ultimi_12_mesi);

		    	//Estraggo il cunsumo annuo totale prendendo la proprità "consumo" dell'oggetto consumiTotali
		    	var consumoAnnuo = consumiTotali.consF0;

		    	switch(stato_misure){
		    		case 2:
		    			$('input[name="consumoAnnuo"]').val(consumoAnnuo);
		    			break;
		    		case 3:
		    			$('input[name="consumoAnnuo"]').val(consumoAnnuo);
		    			$('input[name="misureMensili"]').val(JSON.stringify(normalizzaMensili(misure_mensili_ultimi_12_mesi, commodity)));
		    			break;			    			
		    		case 4:
		    			$('input[name="consumoAnnuo"]').val(consumoAnnuo);
			    		console.log('CONS. MENSILI:');
			    		console.log(normalizzaMensili(misure_mensili_ultimi_12_mesi, commodity)); 
		    			$('input[name="misureMensili"]').val(JSON.stringify(normalizzaMensili(misure_mensili_ultimi_12_mesi, commodity)));
		    			$('input[name="misureGiornaliere"]').val(JSON.stringify(normalizzaGiornalieri(misure_giornaliere_ultimi_12_mesi,commodity)));
		    			break;		
		    		default:
			    		//$('#fieldsetConsumoAnnuo').show();
		    			$('.fieldsetConosci').show();
			    		$('#fieldsetConsumiStorici').addClass('hidden');
			    		$('.loadingGetMisureHeader').removeClass('hidden');
			    		$('#modalLoadingMisure .loadingContainer').addClass('hidden');
			    		$('#modalLoadingMisure .alert-warning').removeClass('hidden');				    		
			    		checkInputForm('usoMisureNO', 'usoMisureNO');
				    	error_call_misure = true;
		    	}

		    	if(!error_call_misure){
		    		if(commodity == 'energiaElettrica'){
		    			$('#consumoAnnuoSomma').val(consumoAnnuo);
			    		$('#fieldsetConsumoAnnuo').hide();
			    		$('#fieldsetConsumiStorici').removeClass('hidden');
			    		checkInputForm('usoMisureSI', 'usoMisureSI');
		    			//Se è fasce ripartisco il consumo
			    		if(fornitura_selezionata_obj[0].trattamento.toUpperCase() != trattamento_mono_label.toUpperCase()){
		    				riempiFasce();	
		    			}
	    			}else if(commodity == 'gas'){
		    			$('#ConsumoAnnuoGas').val(consumoAnnuo);
			    		$('#fieldsetConsumoAnnuoGas').hide();
			    		$('#fieldsetConsumiStorici').removeClass('hidden');
			    		checkInputForm('usoMisureSI', 'usoMisureSI');
	    			}
	    			$('input[name="statoMisure"]').val(stato_misure);

	    			//Chiudo il loading di ricerca delle misure
	    	        setTimeout(function () {
	    	        	$('#modalLoadingMisure').modal('hide')
	    	        }, 1000);
		    	}
		    }).fail(function(xhr, status, error) {
		    	console.log('Error calling getMisure');
	    		$('#fieldsetConsumoAnnuo').show();
	    		$('#fieldsetConsumiStorici').addClass('hidden');
	    		$('.loadingGetMisureHeader').removeClass('hidden');
	    		$('#modalLoadingMisure .loadingContainer').addClass('hidden');
	    		$('#modalLoadingMisure .alert-danger').removeClass('hidden');				    		
	    		checkInputForm('usoMisureNO', 'usoMisureNO');
		    });
		}
	}else if(commodity == 'dual'){
		if(step1 && step2 == null){
			$('#step2').removeClass('disabled');
			$('#step2 a').removeClass('disabledEvent');
			$('#step a[href="#caratteristicheEE"]').tab('show');
		}
		if(step1 == null && step2){
			$('#step3').removeClass('disabled');
			$('#step3 a').removeClass('disabledEvent');
			$('#step a[href="#caratteristicheGas"]').tab('show');
		}		
	}
};

function checkCaratteristicheDualEE(){
	var ok = true;
	radioSelection('dove')
	ok = checkFormCaratteristiche();
	flussoAvanzamento(null, ok, 'dual');
}

function confrontaOfferteDual(){
	valorizzaElementiUso();
	fillMultiselects();
	var ok = true;
	ok = checkFormCaratteristicheGas();
	if(ok){
		$('#confrontaOfferte1').submit();
	}
};

function checkFlatMiste(elm){
	if(elm.value == 'prezzoFisso'){
		$('.fieldsetSoloFlat').removeClass('hidden');
		$('.fieldsetSoloMiste').addClass('hidden');
	}else{
		$('.fieldsetSoloFlat').addClass('hidden');
		$('.fieldsetSoloMiste').removeClass('hidden');
	}
};


function fillMultiselects(){
	var servizi_prodotti = $('#prodServAggiuntivi').val();
	if(servizi_prodotti != null) { $('#serv_prod_hidded').val(servizi_prodotti);}
	var modalita_pagamento = $('#modalitaPagamento').val();
	if(modalita_pagamento != null) { $('#mod_pagamento_hidded').val(modalita_pagamento);}
};

/*CONFRONTO OFFERTA*/
var isCodOffertaValid = true;
function checkCodiceOfferta(value){
	var messageError = "";
	var url = contextPath;
	
	var commodity = $('input[name="commodityType"]:checked').val();
	if(commodity == 'energiaElettrica'){
		commodity = 'ELETTRICO';
	}else if(commodity == 'gas'){
		commodity = 'GAS';
	}else if(commodity == 'dual'){
		commodity = 'DUAL';
	}

	var tipoCliente = $('input[name="dove"]:checked').val();		
	if(tipoCliente == 'casa'){
		tipoCliente = 'DOMESTICO';
	}else if(tipoCliente == 'altriUsi' && commodity == 'GAS'){
		tipoCliente = 'ALTRI_USI';
	}else if(tipoCliente == 'altriUsi' && commodity == 'DUAL'){
		tipoCliente = 'BT_ALTRI_USI';
	}else if(tipoCliente == 'attivita'){
		tipoCliente = 'BT_ALTRI_USI';
	}else if(tipoCliente == 'condominio'){
		tipoCliente = 'CONDOMINI_USO_DOM';
	}
	
	var req = {offertaConfrontoRequest: {
			codiceComune: $('#codiceIstatComune').val(),
			commodityType: commodity,
			tipoCliente: tipoCliente,
			codiceOfferta: value
		}
	}
	
	if($('.code_offerte_not_valid_message').html() != ''){
		$('.code_offerte_not_valid_message').remove();
	}
	if(value == ''){
		$('.icoCodiceOffertaValid').hide();
		$('.icoCodiceOffertaNotValid').hide();
		$('.loadingCheckCodiceOfferta').hide();
		isCodOffertaValid = true; 
		//fillRelatedFields(false, null);
	}else if(value.length == 32){
		$('.icoCodiceOffertaNotValid').hide();	
		$('.loadingCheckCodiceOfferta').show();
		$.ajax({
			type: "post",
			dataType:"json",
		    contentType: 'application/json',
			data: JSON.stringify(req),
			url: url+"/api/rs/it/portal/offertaConfrontoService.json",
			async: false
		}).done(function (data) {
			if(typeof data.OffertaConfrontoResponse.offerta !== 'undefined' && data.OffertaConfrontoResponse.offerta.codErrore == 0 && (data.OffertaConfrontoResponse.result_code == 200 || data.OffertaConfrontoResponse.result_code == 201)){
            	isCodOffertaValid = true;
				$('.loadingCheckCodiceOfferta').hide();
				$('.icoCodiceOffertaValid').show();		
				$('.icoCodiceOffertaNotValid').hide();
				var idTipoOfferta = data.OffertaConfrontoResponse.offerta.idTipoOfferta;
				var idTipologiaFasciaOraria = data.OffertaConfrontoResponse.offerta.idTipologiaFasciaOraria;
				fillRelatedFields(true, idTipoOfferta, idTipologiaFasciaOraria);
			}else{
				if(typeof data.OffertaConfrontoResponse.offerta !== 'undefined'){
					if(data.OffertaConfrontoResponse.offerta.codErrore == 1){
						messageError = "Il codice offerta inserito è associato ad una tipologia di cliente diversa da quella selezionata";
					}else if(data.OffertaConfrontoResponse.offerta.codErrore == 2){
						messageError = "Offerta non disponibile per il CAP o Comune inserito";
					}else if(data.OffertaConfrontoResponse.offerta.codErrore == 3){
						messageError = "Il codice offerta inserito è associato ad un tipo di offerta diverso da quello selezionato";
					}else if(data.OffertaConfrontoResponse.offerta.codErrore == 4){
						messageError = "Offerta non in corso di validità";
					}else{
						messageError = "Codice offerta non disponibile per il confronto";
					}					
				}else{
					messageError = "Codice offerta non presente in archivio";
				}
				
				isCodOffertaValid = false; 
				$('.loadingCheckCodiceOfferta').hide();
				$('.icoCodiceOffertaValid').hide();
				$('.icoCodiceOffertaNotValid').show();
				//fillRelatedFields(false, null, null);
            }
        }).fail(function(xhr, status, error) {
			isCodOffertaValid = false; 
			$('.loadingCheckCodiceOfferta').hide();
			$('.icoCodiceOffertaValid').hide();
			$('.icoCodiceOffertaNotValid').show();
			//fillRelatedFields(false, null, null);
        });
	}else{
		messageError = 'Il formato del codice offerta non è valido'
		isCodOffertaValid = false; 
		$('.icoCodiceOffertaValid').hide();
		$('.loadingCheckCodiceOfferta').hide();
		$('.icoCodiceOffertaNotValid').show();
		//fillRelatedFields(false, null, null);
	}
	//Stampo il messaggio di errore
	if(messageError != ''){
		$('.codiceOfferta').parents('.fieldsetContainer').prepend('<div class="alert alert-warning code_offerte_not_valid_message" role="alert">'+messageError+'</div>');		
	}
}

function fillRelatedFields(valid, idTipoOfferta, idTipologiaFasciaOraria){
	if(valid){
		if(idTipoOfferta == '01'){
			$("input[name=tipoOfferta][value=prezzoFisso]").prop('checked', true);
		}else if(idTipoOfferta == '02' || idTipoOfferta == '03'){
			$("input[name=tipoOfferta][value=prezzoVariabile]").prop('checked', true);
		}
		if(idTipologiaFasciaOraria == '01'){
			$("#tipoTariffa").val('monoraria');
		}else{
			$("#tipoTariffa").val('fasce');			
		}
		conosciConsumo();
	}else{
		$("input[name=tipoOfferta][value=prezzoFisso]").prop('checked', false);
		$("input[name=tipoOfferta][value=prezzoVariabile]").prop('checked', false);	
	}
	radioSelection('tipoOfferta');
}